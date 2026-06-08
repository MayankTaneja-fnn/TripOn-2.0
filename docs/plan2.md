# TripOn 2.0: Master Project Plan (Rev 3 - Evolved Strategy)

## Core Philosophy
The Ranking Engine is the heart of the product. The LLM's job is **Reasoning, Explanation, and Personalization**, not data storage. We avoid training "Hotel A is good" into weights, as data decays. Instead, we train the model on **How to evaluate travel data**.

---

## Phase 1: Data & Ranking Engine (Current Focus)
### Step 1: Data Preprocessing (Completed)
- Consolidate and clean 95k reviews.

### Step 2: PostgreSQL Structured Database
- **Hotels Table:** Name, City, Price, Rating, Lat/Long, Trust_Score.
- **Reviews Table:** HotelId, Text, Rating, Date.
- **Locations Table:** City-based indexing.

### Step 3: Aspect-Based Sentiment Extraction (NLP)
- Extract scores (0.0 to 1.0) for: **Cleanliness, Service, Food, Wifi, Location, Noise, Safety.**
- **Secret Sauce:** Calculate a **Hotel Trust Score** based on review consistency, volume, and recency.

### Step 4: Dynamic Ranking Logic
- Implement `final_score = (w1*cleanliness) + (w2*wifi) + ...`
- Dynamic weights based on user intent (e.g., "Remote Work" -> higher Wifi weight).

---

## Phase 2: Semantic Search (RAG)
### Step 5: Vector Embeddings & Hybrid Search
- Store review embeddings in **ChromaDB**.
- Implement Hybrid Retrieval: Structured SQL (Price/Location) + Unstructured Vector (Vibe/Specific Needs).

---

## Phase 3: Fine-Tuning (The Reasoning Phase)
### Step 6: Specialized Training Objective
- **Goal:** Train Llama 3.2 3B on **Recommendation Style** and **Explainability**.
- **Dataset:** 1000-5000 instruction pairs focused on:
    - Comparing tradeoffs (e.g., "Hotel X is cleaner, but Hotel Y is closer to the metro").
    - Explaining Pros/Cons based on data metrics.
- **Tooling:** Unsloth, LoRA/QLoRA on Google Colab.

---

## Phase 4: Agents & Itinerary Planning
### Step 7: Tool-Equipped Agents
- **Researcher Agent:** Fetches latest reviews to prevent data decay.
- **Planner Agent:** Generates day-by-day itineraries based on selected hotels.

### Step 8: Multi-Source Aggregation
- Combine Google, TripAdvisor, and Booking data to normalize scores and detect trends (e.g., "Cleanliness declining in the last 6 months").

---

## Phase 5: Full Stack Deployment
### Step 9: Next.js + FastAPI + Postgres + Chroma
- Deliver a visually polished UI that shows **Explainable AI** (Why this hotel was recommended).
- Display "Pros/Cons" and "Aspect Scores" alongside AI summaries.
