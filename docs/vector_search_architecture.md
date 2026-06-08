# TripOn 2.0: Evidence-First RAG Architecture

This document details the retrieval and generation pipeline that powers the TripOn 2.0 Chat Assistant.

---

## 1. Multi-Stage Retrieval Flow
When a user submits a query (e.g., *"quiet hotel in Delhi for remote work"*), the system executes the following steps:

### **Step 1: Intent & Constraint Extraction**
*   **Module:** `HybridRetriever._extract_intent`
*   **Logic:** Uses regex to extract location (City) and keywords to adjust ranking weights.
*   **Example:** Query "in Delhi" triggers a SQL filter on `location_id`.

### **Step 2: Candidate Selection (SQL Filter)**
*   **Logic:** Executes a fast SQL query on the `hotels` table to narrow down candidates by geography.
*   **Result:** A list of `hotel_id`s.

### **Step 3: Granular Semantic Search (Vector Search)**
*   **Module:** `HybridRetriever.search`
*   **Logic:** Performs a `pgvector` similarity search (`<=>` operator) against individual **reviews** rather than hotel summaries.
*   **Reasoning:** Reviews contain specific details (WiFi speed, specific noise issues) that are lost in summaries.
*   **Ranking:** Aggregates the best semantic match per hotel into a final score.

---

## 2. Multi-Factor Ranking Engine
The final recommendation order is determined by a weighted formula:

| Weight | Component | Description |
| :--- | :--- | :--- |
| **40%** | **Semantic Similarity** | How well the reviews match the user's specific request. |
| **20%** | **Trust Score** | Global quality metric (Rating + Sentiment). |
| **20%** | **Aspect Match** | Dynamic boost for specific aspects (e.g., Wifi boost if "remote work" mentioned). |
| **10%** | **Avg Rating** | The raw user rating (1.0 - 5.0). |
| **10%** | **Recency** | Exponential decay based on `last_updated` date. |

---

## 3. Evidence Aggregation & LLM Generation
Once top candidates are ranked, the `EvidenceAggregator` prepares the payload for the LLM.

### **Step 4: Semantic Evidence Fetching**
*   For each recommended hotel, the system finds the **Top 3 most relevant reviews** for the specific query.
*   These reviews serve as the "Evidence" that the LLM uses to justify its answer.

### **Step 5: LLM Grounding (Generation)**
*   **Provider:** Groq (Llama 3.3-70b).
*   **System Prompt:** Instructs the model to ONLY use the provided evidence.
*   **Result:** A conversational response like: *"I recommend Hotel X because a guest mentioned 'the wifi was fast enough for Skype calls'..."*

---

## 4. Key Scripts & Roles

| Script | Role |
| :--- | :--- |
| `rag/hybrid_retriever.py` | Orchestrates SQL + Vector search and Multi-Factor Ranking. |
| `rag/evidence_aggregator.py` | Fetches specific reviews to justify recommendations. |
| `rag/chat_assistant.py` | Main entry point; interfaces with Groq/LLM. |
| `scripts/clean_reviews.py` | Maintains data quality by removing non-hotel content. |
| `scripts/aggregate_scores.py` | Updates the Trust Score database. |
