# TripOn 2.0: Script Execution Registry

This document defines the purpose and functionality of the operational scripts in TripOn 2.0.

---

## 1. Data Ingestion & Migration (`scripts/ingestion/`)

### `scripts/ingestion/consolidate_data.py`
- **Role:** Data Normalization
- **Purpose:** Merges `master_hotel_data.csv` and `master_indian_hotel_data.csv` into a unified dataset.
- **Functionality:** Maps heterogeneous data to a unified internal schema, normalizes ratings, and deduplicates records.

### `scripts/ingestion/generate_synthetic_states.py`
- **Role:** Geographic Expansion
- **Purpose:** Ensures nationwide coverage by generating synthetic hotels for missing states/UTs.

### `scripts/ingestion/migrate_to_postgres.py`
- **Role:** Database Setup
- **Purpose:** Loads consolidated data into the PostgreSQL/Supabase relational structure.

---

## 2. Data Quality & Maintenance (`scripts/cleaning/`)

### `scripts/cleaning/clean_reviews.py`
- **Role:** Mislabeled Data Filtering
- **Purpose:** Removes restaurant/cafe reviews that were incorrectly mixed with hotel data.

### `scripts/cleaning/refine_reviews.py`
- **Role:** Advanced Refinement
- **Purpose:** Handles deduplication, removes short/low-value reviews, and cleans technical artifacts.

---

## 3. Intelligence & Scoring (`scripts/scoring/`)

### `scripts/scoring/extract_aspects.py`
- **Role:** Sentiment Intelligence Engine
- **Purpose:** Quantifies unstructured text feedback into 7 distinct aspect scores using VADER.

### `scripts/scoring/aggregate_scores.py`
- **Role:** Ranking & Trust Engine
- **Purpose:** Calculates hotel-level averages and the final `trust_score`.

---

## 4. Semantic Search Layer (RAG)

### Engine Modules (`rag/engine/`)
*   `chat_assistant.py`: Main conversational orchestrator.
*   `hybrid_retriever.py`: Combined SQL and pgvector search logic.
*   `evidence_aggregator.py`: Fetches specific reviews to justify LLM answers.

### Pipeline Scripts (`rag/pipeline/`)
*   `generate_embeddings.py`: Vectorizes individual reviews for search.
*   `generate_summaries.py`: Creates structured textual summaries for hotels.
*   `generate_summary_embeddings.py`: Vectorizes hotel summaries for fast candidate filtering.
