# TripOn 2.0: Script Execution Registry

This document serves as the canonical registry for all scripts developed for the TripOn 2.0 project. It details the purpose, technical functionality, dependencies, and business impact of each script.

---

## Phase 1: Data Acquisition & Normalization

### 1. `scripts/consolidate_data.py`
- **Role:** The "Data Lake Creator". 
- **Purpose:** Centralize heterogeneous raw data into a structured master dataset.
- **Functionality:** 
    - Iterates through 7+ raw CSV datasets (Datafiniti, TripAdvisor, Booking.com, etc.).
    - Maps diverse column headers (e.g., 'Review' vs 'review_text') to a unified internal schema using a mapping dictionary.
    - Normalizes ratings (10-pt vs 5-pt) into a standard 1.0 - 5.0 scale.
    - Cleans whitespace and handles missing geolocation (Lat/Long) fields via interpolation.
- **Impact:** Eliminates data silos, enabling uniform analytical processing.
- **Dependencies:** `pandas`.
- **Output:** `data/datasets/master_hotel_data.csv`.

---

## Phase 2: Review Intelligence Layer

### 2. `scripts/migrate_to_postgres.py`
- **Role:** The "Relational Architect".
- **Purpose:** Persistent storage in a highly available, relational database (Supabase).
- **Functionality:** 
    - Establishes a 3-tier structure (`locations` -> `hotels` -> `reviews`).
    - Implements **High-Resiliency Batching**: Processes 1,000 records at a time using `psycopg2.extras.execute_values` to prevent memory overflows and server timeouts.
    - **Deduplication:** Uses `ON CONFLICT` SQL clauses to maintain integrity.
    - **Robustness:** Built-in retry mechanism for network/operational errors.
- **Impact:** Ensures transactional integrity and provides the backbone for the Ranking Engine.
- **Dependencies:** `pandas`, `psycopg2`.
- **Output:** Fully populated SQL database.

### 3. `scripts/extract_aspects.py`
- **Role:** The "Sentiment Intelligence Engine".
- **Purpose:** Transform unstructured review text into structured aspect-based sentiment data.
- **Functionality:** 
    - Utilizes `vaderSentiment` for high-speed, rule-based NLP extraction.
    - Maps review sentences to 7 pre-defined dimensions (Cleanliness, Service, Food, Wifi, Location, Noise, Safety).
    - Stores resulting scores as a `sentiment_json` blob per review for granular retrieval.
- **Impact:** Enables multi-dimensional hotel analysis beyond a simple 1-5 rating.
- **Dependencies:** `vaderSentiment`, `pandas`, `psycopg2`.
- **Output:** Populated `sentiment_json` fields in the `reviews` table.

### 4. `scripts/aggregate_scores.py`
- **Role:** The "Ranking & Trust Engine".
- **Purpose:** Translate granular sentiment data into ranked hotel profiles.
- **Functionality:** 
    - Leverages SQL Window Functions and Common Table Expressions (CTEs) for efficient aggregation.
    - Implements a weighted **Trust Score** algorithm: `(Avg Rating + (Avg Aspect Scores / 2)) / 2`.
    - Updates hotel master records with pre-computed scores, significantly reducing runtime on the frontend.
- **Impact:** Powers recommendation, search, and "Explainable AI" features.
- **Dependencies:** `psycopg2`.
- **Output:** Populated `trust_score` and aspect scores in the `hotels` table.

### 5. `scripts/generate_synthetic_states.py`
- **Role:** The "Geographic Expansion Engine".
- **Purpose:** Ensure nationwide data coverage for all Indian states and UTs.
- **Functionality:** 
    - Generates 5 synthetic hotel entries per state/UT (35 regions in total).
    - Assigns random, but realistic, latitude/longitude coordinates per region.
    - Aligns schema with the master dataset to allow seamless ingestion.
- **Impact:** Provides a uniform data distribution across India, satisfying business requirements.
- **Dependencies:** `pandas`, `numpy`.
- **Output:** `data/datasets/synthetic_indian_hotel_data.csv`.

---

## Maintenance & Utilities

### 6. `scripts/check_db_status.py` (Deleted post-use)
- **Role:** The "Integrity Auditor".
- **Purpose:** Ad-hoc verification of database state.
- **Impact:** Ensured consistency during schema migrations.
