# TripOn 2.0: AI-Powered Travel Assistant

TripOn 2.0 is an intelligent, RAG-based (Retrieval-Augmented Generation) travel assistant designed to provide personalized, data-backed hotel recommendations.

## Overview
Unlike standard travel bots that rely on basic keyword matching, TripOn 2.0 leverages semantic vector search, structured data metrics, and advanced LLM reasoning to provide recommendations grounded in factual review data and hotel performance metrics.

## Key Features
- **Two-Stage Retrieval Pipeline**: Semantic search across hotel summaries first, followed by refined review retrieval, maximizing precision.
- **Advanced Reranking**: Uses a Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) to deeply rank candidates for the highest relevance.
- **Context-Aware Metrics**: Provides personalized data (e.g., Wifi, Noise, Trust scores) dynamically based on query intent.
- **Hybrid Search**: Combines semantic vector search (`pgvector`) with keyword boosting (`ILIKE`) for robust retrieval.
- **Dynamic Ranking**: Automatically adjusts metric weights based on user intent (e.g., boosting 'Wifi' when searching for work-friendly hotels).
- **NER-based City Extraction**: Uses spaCy (`en_core_web_sm`) to robustly identify cities in user queries.
- **Strict Sentiment Enforcement**: Eliminates false-positives in semantic search by hard-filtering retrieved reviews to ensure they only reflect positive experiences (rating >= 4).
- **Intelligent Quote Extraction**: Dynamically extracts focused, 150-character positive snippets using a secondary LLM request for clean UI card display.
- **Conversational Memory**: Maintains persistent, user-specific chat history using PostgreSQL to provide seamless conversation continuity across sessions.
- **Transparency Engine**: Detailed metric breakdowns (Trust Score, Aspect Scores) available to explain *why* recommendations are made.

## Security & Configuration
All sensitive configurations (Database credentials, Groq API keys) are **never hardcoded**.
- **Management**: Credentials must be stored in an `ml/.env` file.
- **Loading**: Use `load_dotenv()` from `python-dotenv` and access variables via `os.getenv()`.

## System Architecture & Data Flow

```mermaid
graph TD
    UserQuery --> IntentExtraction[Intent Extraction + spaCy NER City Detection]
    IntentExtraction --> Stage1Retrieval[Review-First Hybrid Search: Vector + Keyword]
    Stage1Retrieval --> CandidateSelection[Candidate IDs: Top 50]
    CandidateSelection --> Reranking[Cross-Encoder Reranking using Hotel Summaries]
    Reranking --> TopCandidates[Final Ranking with Dynamic Weights]
    TopCandidates --> EvidenceAggregator[Evidence Aggregator + Metrics]
    EvidenceAggregator --> LLMGeneration[LLM (Llama 3 via Groq) + Chat History]
    LLMGeneration --> Response[Conversational Response]
```

## Technical Stack
- **Languages**: Python
- **Database**: PostgreSQL with `pgvector`
- **Embeddings**: `Xenova/all-MiniLM-L6-v2` (ONNX)
- **Reranking**: `Xenova/ms-marco-MiniLM-L-6-v2` (ONNX)
- **ML Runtime**: `onnxruntime` and `optimum` (No PyTorch required, saves memory)
- **LLM**: Llama 3.3 (via Groq API)
- **NLP**: spaCy (`en_core_web_sm`) for Entity Recognition
- **Environment Management**: `python-dotenv`

## Project Structure
- `ml/rag/`: Core engine components.
  - `engine/`: `ChatAssistant`, `HybridRetriever`, `EvidenceAggregator`, `ChatHistory`, `models`.
  - `pipeline/`: `generate_summaries`, `generate_embeddings`, `generate_summary_embeddings`.
- `ml/scripts/`: ETL scripts (ingestion, cleaning, scoring).
- `ml/tests/`: Integration tests.

## Setup & Running
1.  **Prerequisites**: Ensure Python 3.12+ is installed.
2.  **Environment**: Create `ml/.env` and add:
   ```
   DB_NAME=...
   DB_USER=...
   DB_PASSWORD=...
   DB_HOST=...
   DB_PORT=...
   GROQ_API_KEY=...
   ```
3.  **Install Dependencies**:
   ```bash
   pip install -r ml/requirements.txt
   python -m spacy download en_core_web_sm
   ```
4.  **Execution**: The backend API server must be run to interact with the frontend. Direct execution of `chat_assistant.py` is not supported for interactive chat.
   ```bash
   $env:PYTHONPATH = "C:\path\to\TripOn2.0\ml"
   python ml/api.py
   ```
