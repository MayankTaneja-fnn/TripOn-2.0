# TripOn 2.0: AI-Powered Travel Assistant

TripOn 2.0 is an intelligent, evidence-first hotel recommendation system and travel assistant designed specifically for the Indian market. Unlike traditional search engines that rely purely on star ratings or basic keyword matching, TripOn 2.0 uses **Retrieval-Augmented Generation (RAG)** to "read" thousands of real guest reviews and provide conversational recommendations backed by specific, verifiable evidence.

## 🏗️ Architecture

The project is divided into a robust Next.js frontend and a Python-powered Machine Learning backend, connected to a PostgreSQL database with vector capabilities.

### 1. Frontend (`/frontend`)
- **Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS with a custom sleek, dark-mode glassmorphism design system.
- **State & Data Fetching:** React Server Components (RSC), Next.js Server Actions, and client-side hooks.
- **Authentication:** NextAuth.js configured with Supabase Adapter.

### 2. ML Backend & Engine (`/ml`)
- **Framework:** Python backend (using standard HTTP server or framework to serve the `/chat` route).
- **LLM Engine:** Llama 3.3 (70b-versatile) accessed via the Groq API for high-speed inference.
- **Embedding Model:** `all-MiniLM-L6-v2` via `sentence-transformers`.
- **NLP & Intent:** spaCy (`en_core_web_sm`) for Named Entity Recognition (NER).
- **Reranking:** `cross-encoder/ms-marco-MiniLM-L-6-v2` for precise semantic candidate ranking.

### 3. Database
- **Provider:** PostgreSQL (hosted via Supabase).
- **Vector Storage:** `pgvector` extension for storing 384-dimensional embeddings of hotel reviews.
- **Relational Data:** Stores `hotels`, `reviews`, `locations`, `users`, `chat_history`, and `user_views`.

---

## 📂 File Structure

```text
TripOn2.0/
├── frontend/                     # Next.js Web Application
│   ├── src/app/                  # App Router pages (chat, hotels, login, signup)
│   ├── src/components/           # Reusable UI (ChatSidebar, ChatInterface, AuthForm)
│   ├── src/lib/                  # Utilities and NextAuth configuration
│   └── src/app/actions/          # Next.js Server Actions for DB operations
│
└── ml/                           # Python Backend & ML Pipeline
    ├── rag/engine/               # Core intelligence (retrieval, aggregation, orchestration)
    │   ├── chat_assistant.py     # LLM orchestration and chat history management
    │   ├── hybrid_retriever.py   # Vector + Keyword search & Dynamic Ranking
    │   └── evidence_aggregator.py# SQL-safe evidence packaging & Quote Extraction
    ├── rag/pipeline/             # Embedding generation scripts
    ├── scripts/                  # Data engineering (ingestion, cleaning, scoring)
    └── api.py                    # Backend API endpoint server
```

---

## 🔄 The Complete Flow (How a Request is Handled)

When a user types *"Find me a clean hotel in Delhi with fast Wifi"*, the system executes the following pipeline:

1. **Intent Extraction (NLP):**
   - The query is parsed using `spaCy` to extract the destination city ("Delhi").
   - Intent tags ("clean", "Wifi") are detected based on internal heuristics.
2. **Hybrid Retrieval (Stage 1):**
   - The system queries the `pgvector` database, combining semantic vector similarity with exact keyword matching (`ILIKE`) to fetch a broad set of candidate hotels in the targeted city.
3. **Dynamic Reranking (Stage 2):**
   - A Cross-Encoder model re-evaluates the retrieved candidates.
   - The **Dynamic Ranking Engine** adjusts internal weights—since the user asked for "fast Wifi", the hotel's NLP-derived *Wifi Score* is heavily boosted in the final math.
4. **Evidence Aggregation & Quote Extraction:**
   - The `evidence_aggregator.py` pulls the top reviews for the best candidates.
   - A strict SQL filter guarantees only positive reviews (rating >= 4) are selected.
   - A secondary LLM request dynamically extracts a concise, 150-character positive snippet from the reviews to act as a "Quote" for the UI.
5. **LLM Generation:**
   - The optimized Evidence Packet (structured hotel data + quotes) and the recent `chat_history` are passed to Llama 3.
   - Llama 3 generates a brief conversational intro, strictly barred from creating its own fake markdown lists or hallucinated scores.
6. **Frontend Presentation:**
   - The Next.js frontend renders the LLM's conversational text alongside beautiful, interactive `HotelRecommendationCard` components populated directly by the structured Evidence Packet.

---

## 🧠 How Retrieval & Embeddings Work

**Embeddings Creation:**
During the data engineering phase, over 81,000 raw guest reviews were vectorized using the `all-MiniLM-L6-v2` transformer model. This converts human text into 384-dimensional mathematical arrays (vectors) that capture the *semantic meaning* of the text, rather than just exact words. These vectors are saved in the `pgvector` PostgreSQL column.

**Hybrid Search:**
Relying entirely on vectors can sometimes miss exact names or hard constraints. TripOn 2.0 uses a hybrid approach. It calculates the Cosine Distance (`<=>`) between the user's query vector and the review vectors in the DB, but simultaneously applies traditional SQL filters (like `city_id = X`) and keyword boosting to ensure the highest accuracy.

---

## ✨ Features (Small to Big)

### 🤖 AI & Machine Learning
- **Aspect-Based Sentiment Analysis (ABSA):** VADER sentiment analysis calculates granular scores for Cleanliness, Service, Food, Wifi, Location, Noise, and Safety based on review text.
- **Trust Score Engine:** A custom 0-10 metric blending raw user ratings with our processed NLP sentiment scores.
- **Intelligent Quote Extraction:** Secondary LLM tasks parse raw reviews to find the perfect 150-character highlight quote for the UI.
- **Strict Sentiment Enforcement:** Vector search can sometimes return negative reviews if they match the query semantically ("The wifi was NOT fast"). The aggregator explicitly blocks reviews with <4 ratings from being used as evidence.

### 💬 Conversational Experience
- **Persistent Conversational Memory:** PostgreSQL maintains chat sessions. The Llama 3 prompt is automatically injected with the last 5 turns of conversation, allowing users to ask follow-up questions seamlessly.
- **Auto-Generated Chat Titles:** New chat sessions are instantly summarized by the LLM into a short tag (e.g., "Delhi Business Trip") for the sidebar navigation.

### 💻 User Interface & Resilience
- **Glassmorphic Design:** A premium, dark-mode aesthetic utilizing deep blues, purples, and frosted glass effects (Backdrop blur).
- **Graceful Error Handling:**
  - Global Next.js Error Boundaries (`error.tsx`) catch unexpected server crashes and display a friendly *"Oops! We'll be back soon"* UI.
  - Global loading states (`loading.tsx`) provide smooth spinner animations during route transitions.
  - Client-side forms (Login/Signup) and the Chat Interface utilize inline loading pulses and handle API failures gracefully without breaking the application.
- **Trending & Recent Stays:** The homepage tracks user views to dynamically display "Recently Explored" hotels, falling back to global "Trending Hotels" for logged-out users.

---

## 🚀 Getting Started

### 1. Start the ML Backend
```bash
cd ml
pip install -r requirements.txt
python -m spacy download en_core_web_sm
# Create a .env file with your DB credentials & Groq API Key
python api.py
```

### 2. Start the Frontend
```bash
cd frontend
npm install
# Create a .env file based on .env.example
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start exploring!
