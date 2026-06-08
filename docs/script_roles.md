# TripOn 2.0: Script Execution Registry

This document details the purpose, execution context, and impact of every script developed and run during the project lifecycle.

---

## Phase 1: Data Acquisition & Normalization

### 1. `scripts/consolidate_data.py`
- **Role:** The "Data Lake Creator". 
- **Functionality:** 
    - Iterates through 7 heterogeneous CSV datasets from different sources (Datafiniti, TripAdvisor, etc.).
    - Maps diverse column headers (e.g., 'Review' vs 'review_text') to a unified internal schema.
    - Normalizes 10-point and 5-point ratings into a standard 1.0 - 5.0 scale.
    - Cleans whitespace and handles missing geolocation (Lat/Long) fields.
- **Output:** `data/datasets/master_hotel_data.csv` (94,894 unified records).

---

## Phase 2: Review Intelligence Layer

### 2. `scripts/migrate_to_postgres.py`
- **Role:** The "Relational Architect".
- **Functionality:** 
    - Establishes a 3-tier relational structure in Supabase: `locations` -> `hotels` -> `reviews`.
    - Implements **High-Resiliency Batching**: Processes 1,000 rows at a time to prevent server timeouts.
    - **Deduplication Logic**: Uses `ON CONFLICT` clauses to ensure hotels and locations are not duplicated.
    - **Reconnection Logic**: Automatically handles intermittent network drops during the 95k record transfer.
- **Output:** Fully populated SQL database on Supabase.

### 3. `scripts/extract_aspects.py`
- **Role:** The "Sentiment Intelligence Engine".
- **Functionality:** 
    - Pivoted from heavy Deep Learning (BART) to a high-speed **Rule-Based Engine** using VADER.
    - Uses a weighted keyword mapper to scan review text for 7 specific travel dimensions (Cleanliness, Service, Food, Wifi, Location, Noise, Safety).
    - **Sentence-Level Analysis**: Instead of scoring the whole review, it isolates sentences mentioning specific aspects for higher precision.
    - Updates the `sentiment_json` field in the database with granular scores (1-10).
- **Output:** Granular intelligence data for ~95k reviews.

### 4. `scripts/aggregate_scores.py`
- **Role:** The "Ranking & Trust Engine".
- **Functionality:** 
    - Executes high-performance SQL window functions to roll up review scores to the hotel level.
    - **Trust Score Formula**: Implements a weighted algorithm: `(Avg Rating + (Avg Aspect Scores / 2)) / 2`.
    - Updates the master `hotels` table with 9 distinct metrics per hotel.
- **Output:** Ranked hotel profiles ready for AI recommendation.

---

## Maintenance & Utilities

### 5. `scripts/check_db_status.py` (Deleted post-use)
- **Role:** The "Integrity Auditor".
- **Functionality:** Verified row counts and table schema existence during the transition between migration and analysis.
