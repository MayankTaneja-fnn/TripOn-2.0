import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool
from rag.engine.models import get_model, get_reranker
import numpy as np
import json
import spacy

load_dotenv()

# Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

# Create connection pool
db_pool = psycopg2.pool.ThreadedConnectionPool(1, 3, **DB_CONFIG)
_embedding_cache = {}

class HybridRetriever:
    def __init__(self):
        self.model = get_model()
        self.reranker = get_reranker()
        try:
            self.nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer", "tagger", "attribute_ruler", "tok2vec"])
        except OSError:
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer", "tagger", "attribute_ruler", "tok2vec"])
        
        # Semantic Intent Data
        self.intent_map = {
            "wifi": "Searching for hotels with good internet or wifi access",
            "remote_work": "Searching for hotels suitable for remote work or workation",
            "romantic": "Searching for romantic hotels for couples",
            "family": "Searching for family-friendly hotels with kids facilities"
        }
        self.intent_embeddings = self.model.encode(list(self.intent_map.values()))

    def _get_conn(self):
        return db_pool.getconn()

    def _put_conn(self, conn):
        db_pool.putconn(conn)

    def _get_city_id(self, city_name):
        """Lookup city ID from locations table."""
        if not city_name: return None
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM locations WHERE city ILIKE %s", (city_name,))
                res = cur.fetchone()
                return res[0] if res else None
        finally:
            self._put_conn(conn)

    def _extract_intent(self, query):
        """Extracts intent tags and city using semantic similarity and spaCy NER."""
        query_embedding = self.model.encode(query, normalize_embeddings=True)
        # Cosine similarity is the dot product of normalized embeddings
        similarities = np.dot(self.intent_embeddings, query_embedding[0])
        
        extracted_tags = []
        for i, (tag, _) in enumerate(self.intent_map.items()):
            if similarities[i] > 0.5:
                extracted_tags.append(tag)
        
        # City extraction using spaCy NER
        doc = self.nlp(query)
        city_name = None
        for ent in doc.ents:
            if ent.label_ == "GPE":
                city_name = ent.text
                break
        
        city_id = self._get_city_id(city_name)
        return {"city_id": city_id, "tags": extracted_tags}

    def search(self, user_query, top_k=5):
        """Orchestrate Review-First Hybrid Retrieval and Reranking."""
        constraints = self._extract_intent(user_query)
        
        # Use cache
        if user_query not in _embedding_cache:
            _embedding_cache[user_query] = self.model.encode(user_query, normalize_embeddings=True)[0].tolist()
        
        query_embedding = _embedding_cache[user_query]
        
        conn = self._get_conn()
        try:
            # 1. Review-First Hybrid Retrieval (Stage 1)
            # Vector + Keyword search
            keyword_filter = ""
            params = ["[" + ",".join(map(str, query_embedding)) + "]"]
            
            if constraints.get("tags"):
                # Simple keyword boosting
                keywords = []
                for tag in constraints["tags"]:
                    keywords.extend(["wifi", "romantic", "quiet", "breakfast", "work"])
                
                conditions = [f"review_text ILIKE %s" for _ in keywords]
                keyword_filter = " AND (" + " OR ".join(conditions) + ")"
                params.extend([f"%{kw}%" for kw in keywords])
            
            if constraints.get("city_id"):
                keyword_filter += " AND h.location_id = %s"
                params.append(constraints["city_id"])
            
            search_query = f"""
            SELECT h.id, h.name, 
                   (1 - (r.embedding <=> %s::vector)) AS sem_sim
            FROM reviews r
            JOIN hotels h ON r.hotel_id = h.id
            WHERE 1=1 {keyword_filter}
            ORDER BY sem_sim DESC
            LIMIT 50
            """
            
            with conn.cursor() as cur:
                cur.execute(search_query, tuple(params))
                review_results = cur.fetchall()
            
            candidate_ids = list(set(row[0] for row in review_results))
            if not candidate_ids:
                return "No hotels found matching criteria.", None
                
            # 2. Rerank using HOTEL SUMMARIES (Stage 2)
            summary_query = "SELECT hotel_id, summary FROM hotel_summaries WHERE hotel_id IN %s"
            with conn.cursor() as cur:
                cur.execute(summary_query, (tuple(candidate_ids),))
                summary_results = cur.fetchall()
            
            candidate_summaries = {row[0]: row[1] for row in summary_results}
            
            # Cross-Encoder Reranking
            pairs = [(user_query, candidate_summaries[h_id]) for h_id in candidate_ids if h_id in candidate_summaries]
            rerank_scores = self.reranker.predict(pairs)
            rerank_map = {h_id: float(score) for h_id, score in zip([h_id for h_id in candidate_ids if h_id in candidate_summaries], rerank_scores)}
            
            # 3. Final Ranking with metrics
            ranking_query = """
            SELECT h.id, h.name, AVG((r.sentiment_json->>'polarity')::float) as avg_sentiment,
                   h.trust_score, h.rating_avg, h.cleanliness_score, h.service_score,
                   h.food_score, h.wifi_score, h.location_score, h.noise_score, h.safety_score,
                   EXTRACT(EPOCH FROM (CURRENT_DATE - h.last_updated))/(3600*24*30) AS recency_months
            FROM hotels h
            JOIN reviews r ON r.hotel_id = h.id
            WHERE h.id IN %s
            GROUP BY h.id, h.name
            """
            with conn.cursor() as cur:
                cur.execute(ranking_query, (tuple(candidate_ids),))
                results = cur.fetchall()
        finally:
            self._put_conn(conn)
            
        # 4. Multi-Factor Ranking Engine
        # Dynamically adjust weights based on detected user intent
        tags = constraints.get("tags", [])
        base_weights = {"Cleanliness": 0.1, "Service": 0.1, "Food": 0.1, "Wifi": 0.1, "Location": 0.1, "Noise": 0.1, "Safety": 0.1}
        
        # Boost aspect importance based on detected intent
        for tag in tags:
            if tag == 'wifi': base_weights['Wifi'] += 0.3
            if tag == 'remote_work': base_weights['Wifi'] += 0.2; base_weights['Noise'] += 0.2
            if tag == 'romantic': base_weights['Service'] += 0.3
            if tag == 'family': base_weights['Cleanliness'] += 0.2; base_weights['Safety'] += 0.2
            
        ranked_results = []
        for row in results:
            h_id, name, avg_sentiment, trust, rating, clean, service, food, wifi, loc, noise, safety, recency = row
            
            rerank_score = rerank_map.get(h_id, 0.0)
            
            # Aspect Match Score: normalized to 0-1
            aspects = {'Cleanliness': clean, 'Service': service, 'Food': food, 'Wifi': wifi, 'Location': loc, 'Noise': noise, 'Safety': safety}
            aspect_match = sum(float(aspects.get(k, 5.0))/10.0 * base_weights[k] for k in base_weights)
            
            # Recency Score: decays over time (1 year = 0 score)
            recency_score = max(0, 1 - (float(recency) / 12.0))
            
            # Sentiment boost (map -1..1 to 0..1)
            safe_sentiment = float(avg_sentiment) if avg_sentiment is not None else 0.0
            sentiment_boost = (safe_sentiment + 1.0) / 2.0
            
            # Dynamic Final Formula: Reranked relevance carries the highest weight
            final_score = (
                0.40 * rerank_score +
                0.20 * sentiment_boost +
                0.15 * aspect_match +
                0.10 * (float(trust) / 10.0) +
                0.10 * recency_score +
                0.05 * (float(rating) / 5.0)
            )
            
            reasoning = f"Ranked based on semantic relevance, sentiment, and matched aspect criteria."
            
            ranked_results.append((name, reasoning, final_score))
            
        ranked_results.sort(key=lambda x: x[2], reverse=True)
        return ranked_results[:top_k], query_embedding
