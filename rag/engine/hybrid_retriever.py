import psycopg2
from sentence_transformers import SentenceTransformer
import json
import re

# Configuration
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "l2hrErFIhdQUMHUx",
    "host": "db.uikfjspwpywhqohppkmb.supabase.co",
    "port": "5432"
}

class HybridRetriever:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

    def _extract_intent(self, query):
        """Simple intent extractor."""
        city_match = re.search(r"in\s+([A-Z][a-z]+)", query)
        city = city_match.group(1) if city_match else None
        return {"city": city}

    def _get_sql_candidates(self, constraints):
        """Fast SQL filter."""
        query = "SELECT id FROM hotels WHERE 1=1"
        params = []
        if constraints.get("city"):
            query += " AND location_id IN (SELECT id FROM locations WHERE city ILIKE %s)"
            params.append(constraints["city"])
        
        with self.conn.cursor() as cur:
            cur.execute(query, params)
            return [row[0] for row in cur.fetchall()]

    def search(self, user_query, top_k=5):
        """Orchestrate Hybrid Retrieval with multi-factor ranking."""
        constraints = self._extract_intent(user_query)
        candidates = self._get_sql_candidates(constraints)
        
        if not candidates:
            return "No hotels found matching criteria.", None

        # Define dynamic weights based on intent
        intent_weights = {"Cleanliness": 0.1, "Service": 0.1, "Food": 0.1, "Wifi": 0.2, "Location": 0.1, "Noise": 0.2, "Safety": 0.2}
        if "remote work" in user_query.lower() or "wifi" in user_query.lower():
            intent_weights.update({"Wifi": 0.4, "Noise": 0.4})
        if "quiet" in user_query.lower():
            intent_weights.update({"Noise": 0.6})
        
        query_embedding = self.model.encode(user_query, normalize_embeddings=True).tolist()
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        # 1. Semantic search on REVIEWS (more granular than summaries)
        # We take the best matching review similarity per hotel
        search_query = """
        SELECT h.name, MAX(1 - (r.embedding <=> %s)) AS sem_sim, 
               h.trust_score, h.rating_avg,
               h.cleanliness_score, h.service_score, h.food_score, h.wifi_score, 
               h.location_score, h.noise_score, h.safety_score,
               EXTRACT(EPOCH FROM (CURRENT_DATE - h.last_updated))/(3600*24*30) AS recency_months
        FROM reviews r
        JOIN hotels h ON r.hotel_id = h.id
        WHERE h.id IN %s AND r.embedding IS NOT NULL
        GROUP BY h.id, h.name
        """
        
        with self.conn.cursor() as cur:
            cur.execute(search_query, (embedding_str, tuple(candidates),))
            results = cur.fetchall()
        
        # 2. Multi-Factor Ranking Engine
        ranked_results = []
        for row in results:
            name, sem_sim, trust, rating, clean, service, food, wifi, loc, noise, safety, recency = row
            
            # Aspect Match Score (Dot product of aspect scores and intent weights)
            aspects = {'Cleanliness': clean, 'Service': service, 'Food': food, 'Wifi': wifi, 'Location': loc, 'Noise': noise, 'Safety': safety}
            aspect_match = sum(float(aspects.get(k, 5.0))/10.0 * intent_weights[k] for k in intent_weights)
            
            # Recency Score (Exponential decay)
            recency_score = max(0, 1 - (float(recency) / 12.0)) # Decay over 12 months
            
            # Final Formula
            final_score = (
                0.40 * float(sem_sim) +
                0.20 * (float(trust) / 10.0) +
                0.20 * aspect_match +
                0.10 * (float(rating) / 5.0) +
                0.10 * recency_score
            )
            
            # For reasoning, we'll use a placeholder or the hotel metadata since summaries are often missing
            reasoning = f"Top-rated for your criteria with a semantic match of {round(float(sem_sim)*100, 1)}%."
            
            ranked_results.append((name, reasoning, final_score))
            
        ranked_results.sort(key=lambda x: x[2], reverse=True)
        return ranked_results[:top_k], query_embedding

    def __del__(self):
        self.conn.close()

if __name__ == "__main__":
    retriever = HybridRetriever()
    print(retriever.search("quiet hotel in Delhi"))
