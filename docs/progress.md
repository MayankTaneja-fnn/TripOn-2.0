# TripOn 2.0: Technical Architecture & Progress Documentation

## Glossary of Terms
*   **ABSA (Aspect-Based Sentiment Analysis):** A technique that breaks down a review to understand sentiment about specific features (e.g., "The hotel was great, but the Wifi was slow" -> Positive about Hotel, Negative about Wifi).
*   **CTE (Common Table Expression):** A temporary, named result set in a database query, used to make complex SQL queries easier to write and read.
*   **JSONB:** A format for storing data in a database that allows for flexible, nested structures (like a dictionary of aspect scores).
*   **NLP (Natural Language Processing):** The field of AI that allows computers to read, interpret, and understand human language.
*   **RAG (Retrieval-Augmented Generation):** An AI technique that combines a search engine with a language model to provide answers based on specific, trusted data sources.
*   **Schema:** The "blueprint" of a database, defining the tables and the relationships between them.

---

## 1. Project Overview & Evolution
TripOn 2.0 is an intelligent hotel ranking and recommendation engine. The project has evolved from a city-specific prototype (Delhi) to a nationwide platform covering all 36 Indian states and union territories.

---

## 2. Data Foundation & Normalization

### A. Data Consolidation
The project is built upon a consolidated, nationwide dataset covering all 36 Indian states and union territories.
- **Data Source:** A combination of primary hotel datasets and high-quality synthetic data generated to ensure complete geographical representation.
- **Consolidation Script:** `scripts/consolidate_data.py` (Library: `pandas`).
- **Mapping:** Heterogeneous column names from original data sources were mapped to a unified internal schema: `hotel_name`, `review_text`, `rating`, `city`, `latitude`, `longitude`, `province`, `country`, `data_source`.
- **Rating Standardization:** All ratings (e.g., 10-pt, 5-pt) were converted to a uniform 1.0 - 5.0 scale.
- **Deduplication:** Aggressive removal of duplicates based on `review_text` + `date` to ensure a clean, high-quality data lake.

### C. Nationwide Expansion
- **Script:** `scripts/generate_synthetic_states.py` (Library: `pandas`, `numpy`).
- **Rationale:** To ensure nationwide representation, 5 synthetic hotels were generated for every Indian state/UT previously missing from the data.
- **Alignment:** Synthetic records strictly match the unified schema.

---

## 3. Database Architecture (Supabase/PostgreSQL)

### Full Schema Definition
```sql
-- 1. Locations Table: Stores unique geographical entities.
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    province VARCHAR(255),
    country VARCHAR(100),
    UNIQUE(city, province, country)
);

-- 2. Hotels Table: Master profiles with pre-computed intelligence.
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    address TEXT,
    price_level VARCHAR(10),
    rating_avg DECIMAL(3, 2), -- Aggregated mean rating (1.0-5.0)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Aspect Scores (Calculated from reviews, 1.0-10.0):
    trust_score DECIMAL(3, 2),
    cleanliness_score DECIMAL(3, 2),
    service_score DECIMAL(3, 2),
    wifi_score DECIMAL(3, 2),
    food_score DECIMAL(3, 2),
    location_score DECIMAL(3, 2),
    noise_score DECIMAL(3, 2),
    safety_score DECIMAL(3, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reviews Table: Granular feedback.
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    review_text TEXT NOT NULL,
    rating DECIMAL(3, 1),
    review_date TIMESTAMP,
    source VARCHAR(100),
    sentiment_json JSONB, -- Stores granular aspect-based scores (1-10)
    is_processed BOOLEAN DEFAULT FALSE
);
```

---

## 4. Review Intelligence Engine

### A. Aspect-Based Sentiment Analysis (ABSA)
- **Model Choice:** `vaderSentiment`.
- **Rationale:** High-performance, rule-based NLP was required to process >140k reviews within hardware constraints. Deep learning alternatives (BART-Large) were tested but failed due to memory limitations.
- **Processing Logic (`scripts/extract_aspects.py`):**
    1. The script iterates through the `reviews` table.
    2. Review text is tokenized into sentences.
    3. Each sentence is mapped against keyword dictionaries for 7 aspects (Cleanliness, Service, Food, Wifi, Location, Noise, Safety).
    4. VADER calculates polarity scores per sentence, which are aggregated into a `sentiment_json` blob per review.

### B. Ranking & Trust Engine (`scripts/aggregate_scores.py`)
- **Methodology:** SQL Common Table Expressions (CTEs) execute the final aggregation.
- **Formula:** 
    - **Aspect Average:** Mean of sentiment scores for all processed reviews for a hotel.
    - **Trust Score:** `(Avg Rating + (Avg Aspect Scores / 2)) / 2`. This formula balances raw user ratings with consistent performance across defined dimensions.
- **Output:** Populates the `hotels` table with calculated scores, enabling real-time filtering and ranking.

---

## 5. Current Metrics
- **Total Processed Reviews:** 148,844
- **Unique Hotels Indexed:** 4,835
- **Unique Locations:** 2,276
- **Database Latency:** < 20ms average query response.
