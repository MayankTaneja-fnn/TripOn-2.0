# TripOn 2.0: Script Execution Registry

This document defines the purpose and functionality of the operational scripts in TripOn 2.0.

---

## 1. Data Foundation

### `scripts/consolidate_data.py`
- **Role:** Data Normalization
- **Functionality:** Maps heterogeneous data to a unified internal schema and normalizes ratings to a 1.0 - 5.0 scale.
- **Output:** `data/datasets/master_hotel_data.csv`.

### `scripts/generate_synthetic_states.py`
- **Role:** Geographic Expansion
- **Functionality:** Ensures nationwide coverage by generating 5 synthetic hotels per Indian state/UT, maintaining schema alignment with the master dataset.
- **Output:** `data/datasets/synthetic_indian_hotel_data.csv`.

---

## 2. Review Intelligence Layer

### `scripts/migrate_to_postgres.py`
- **Role:** Relational Architecture
- **Functionality:** Loads the master and synthetic datasets into a normalized Supabase structure (`locations`, `hotels`, `reviews`). Handles bulk insertion with relational integrity.

### `scripts/extract_aspects.py`
- **Role:** Sentiment Intelligence Engine
- **Functionality:** Uses `vaderSentiment` for rule-based extraction of 7 aspect scores (Cleanliness, Service, etc.) per review. Populates `sentiment_json`.

### `scripts/aggregate_scores.py`
- **Role:** Ranking & Trust Engine
- **Functionality:** Uses SQL CTEs to calculate aspect averages and a weighted `trust_score` per hotel. Updates hotel profiles in the database.
