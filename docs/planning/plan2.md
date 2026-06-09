# TripOn 2.0: Master Project Plan

## Core Philosophy
The Ranking Engine is the heart of the product. The LLM's job is **Reasoning, Explanation, and Personalization**, not data storage. We train the model on **How to evaluate travel data** effectively.

---

## Phase 1: Data & Ranking Engine (Completed)
1. **Data Normalization:** Consolidated all data sources into a unified, nationwide dataset (148k+ reviews).
2. **PostgreSQL Database:** Implementation of a normalized 3-tier schema (`locations`, `hotels`, `reviews`).
3. **Aspect-Based Sentiment Extraction:** Granular scoring of 7 dimensions (Cleanliness, Service, Food, Wifi, Location, Noise, Safety).
4. **Dynamic Ranking:** Computed `trust_score` and aspect averages for all hotels.

---

## Phase 2: Semantic Search (RAG - Current Focus)
- **Vector Embeddings & Hybrid Search:** Store review embeddings in **PostgreSQL (`pgvector`)**. Implement hybrid retrieval (Structured SQL + Unstructured Vector) for contextually relevant recommendations.

---

## Phase 3: Fine-Tuning (The Reasoning Phase)
- **Specialized Training:** (Optional) Fine-tune Llama 3.3 70B on **Recommendation Style** and **Explainability** using 1000-5000 instruction pairs.

---

## Phase 4: Agents & Itinerary Planning
- **Tool-Equipped Agents:** Implement Researcher Agent (fetches latest reviews) and Planner Agent (generates itineraries).

---

## Phase 5: Full Stack Deployment
- **Deployment:** Deliver a visually polished UI (Next.js/FastAPI) showcasing Explainable AI, featuring Pros/Cons and aspect scores.
