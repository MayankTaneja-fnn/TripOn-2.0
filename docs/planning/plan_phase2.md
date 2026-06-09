# Phase 2 Detailed Implementation: Semantic Search

This document details the step-by-step implementation of the Evidence-First Roadmap.

---

## 1. Stage 2.1: Embedding Pipeline
**Objective:** Represent 81,636+ reviews as context-enriched numerical vectors (embeddings) for high-precision semantic searching.

### Technical Implementation:
1.  **Environment:** Ensure `pgvector`, `sentence-transformers`, `torch`, and `psutil` are installed.
2.  **Script (`rag/generate_embeddings.py`):**
    *   **Data Ingestion:** Query `reviews`, `hotels`, and `locations` via SQL join, processing in chunks using `cur.fetchmany(BATCH_SIZE)`.
    *   **Test-First Strategy:** The script runs a dry-run for the first 500 reviews; requires manual verification before full execution.
    *   **Context Enrichment:** Enriched document text: `f"Review:\n{review_text}\n\nHotel:\n{hotel_name}\n\nCity:\n{city}"`
    *   **Transformation:** Use `all-MiniLM-L6-v2` for 384-dimensional vector generation, with `normalize_embeddings=True`.
    *   **Database Integration:** Update PostgreSQL `reviews` table with `embedding` column using `pgvector` extension.
    *   **Performance Logging:** Log metrics per batch to `docs/embedding_metrics.csv` (Batch Number, Reviews Processed, Time Taken, Embeddings/sec, Memory Usage).
3.  **Rationale:** Test-first validation ensures embedding quality. Batch processing via SQL cursors ensures memory efficiency. Unified storage in Supabase (`pgvector`) simplifies architecture and deployment.

---

## 2. Stage 2.2: Retrieval Validation
**Objective:** Verify that the embeddings accurately capture the semantic meaning.

### Implementation:
1.  **Test Suite Creation:** Develop a script to run predefined queries (e.g., "Quiet rooms," "Great breakfast," "Remote work") against the `pgvector` store.
2.  **Evaluation:** Manually or semi-automatically inspect the top-K retrieved reviews.
3.  **Success Metric:** The system must return reviews that conceptually match the query, even if they don't share exact keywords.

---

## 3. Stages 2.3 - 2.4: Summary Generation & Indexing
**Objective:** Create lightweight, high-performance summaries for rapid candidate retrieval.

### Implementation:
1.  **Summary Logic (`rag/generate_summaries.py`):**
    *   Input: `hotel_name`, `avg_rating`, `trust_score`, `aspect_scores`, and top-retrieved reviews.
    *   Output: A structured text summary per hotel.
2.  **Summary Vectorization:** Similar to Step 1, generate embeddings for these summaries and store them in the `hotel_summaries` table (using `pgvector`).

---

---

## 4. Stages 2.5 - 2.7: Hybrid Retrieval, Explainability & Chat
**Objective:** Build the unified query engine, explainability, and conversational interface.

### Implementation:
1.  **Modular Service (`rag/hybrid_retriever.py`):**
    *   **Orchestration:** `HybridRetriever` class designed for integration with FastAPI/Next.js.
    *   **Intent Parsing:** Extract constraints (e.g., `City: "Delhi"`) from the natural language query.
    *   **SQL Filtering:** Efficient PostgreSQL query to fetch `hotel_id` candidates based on hard constraints.
    *   **Semantic Search:** Perform `pgvector` inner product search (`<=>` operator) on the candidate subset in the `hotel_summaries` or `reviews` table.
2.  **Explainability Layer (`rag/evidence_aggregator.py`):**
    *   **Evidence Aggregation:** Retrieve the top reviews mapped to the recommended hotels.
    *   **JSON Response:** Structured output containing recommendations, reasoning, evidence (reviews), and drawbacks.
3.  **Chat Assistant (`rag/chat_assistant.py`):**
    *   **Orchestration:** Takes the Evidence Packet and prompts an LLM (e.g., Llama 3) to generate a conversational response grounded in the provided evidence.
