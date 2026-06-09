import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool
import json

load_dotenv()

# Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

db_pool = psycopg2.pool.ThreadedConnectionPool(1, 10, **DB_CONFIG)

class EvidenceAggregator:
    def _get_conn(self):
        return db_pool.getconn()

    def _put_conn(self, conn):
        db_pool.putconn(conn)

    def get_hotel_details(self, hotel_name):
        """Fetches all metrics and drawbacks for a single hotel."""
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                query = """
                SELECT id, rating_avg, trust_score, cleanliness_score, service_score, 
                       food_score, wifi_score, location_score, noise_score, safety_score
                FROM hotels WHERE name = %s
                """
                cur.execute(query, (hotel_name,))
                h_data = cur.fetchone()
                
                if not h_data: return None
                
                h_id, rating, trust, *aspects = h_data
                aspect_names = ['Cleanliness', 'Service', 'Food', 'Wifi', 'Location', 'Noise', 'Safety']
                
                return {
                    "hotel_name": hotel_name,
                    "metrics": {
                        "rating": float(rating),
                        "trust_score": float(trust),
                        "cleanliness_score": float(aspects[0]),
                        "service_score": float(aspects[1]),
                        "food_score": float(aspects[2]),
                        "wifi_score": float(aspects[3]),
                        "location_score": float(aspects[4]),
                        "noise_score": float(aspects[5]),
                        "safety_score": float(aspects[6])
                    },
                    "drawbacks": [aspect_names[i] for i, s in enumerate(aspects) if s < 6.0]
                }
        finally:
            self._put_conn(conn)

    def get_metric_breakdown(self, hotel_name):
        """Provides a breakdown of the hotel's performance metrics and the logic behind them."""
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                query = """
                SELECT trust_score, cleanliness_score, service_score, 
                       food_score, wifi_score, location_score, noise_score, safety_score,
                       review_count
                FROM hotels 
                WHERE name = %s
                """
                cur.execute(query, (hotel_name,))
                h_data = cur.fetchone()
                
                if not h_data: return "Hotel metrics not found."
                
                trust, *aspects, count = h_data
                aspect_names = ['Cleanliness', 'Service', 'Food', 'Wifi', 'Location', 'Noise', 'Safety']
                
                breakdown = {
                    "hotel_name": hotel_name,
                    "trust_score": float(trust),
                    "based_on_reviews": int(count),
                    "aspect_scores": {aspect_names[i]: float(aspects[i]) for i in range(len(aspect_names))},
                    "transparency_note": f"The Trust Score of {trust} is computed based on analysis of {count} reviews, weighing aspect consistency and sentiment distribution."
                }
                return breakdown
        finally:
            self._put_conn(conn)

    def aggregate(self, recommendations, query_embedding=None, tags=None):
        """
        Takes raw retrieval results and aggregates supporting evidence with keyword boosting
        and context-aware metrics.
        """
        evidence_packet = {"recommendations": []}
        
        KEYWORD_MAP = {
            "wifi": ["wifi", "internet", "connection", "network"],
            "remote_work": ["work", "office", "desk", "laptop"],
            "romantic": ["romantic", "couple", "date", "ambience"],
            "family": ["family", "kids", "children", "spacious"]
        }
        
        # Tag to aspect index mapping: Cleanliness:0, Service:1, Food:2, Wifi:3, Location:4, Noise:5, Safety:6
        TAG_TO_ASPECT_INDICES = {
            'wifi': [3],
            'remote_work': [3, 1], # Wifi, Service
            'romantic': [1], # Service
            'family': [0, 6] # Cleanliness, Safety
        }
        
        boost_keywords = []
        if tags:
            for tag in tags:
                boost_keywords.extend(KEYWORD_MAP.get(tag, []))
        
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                for hotel_name, reasoning, score in recommendations:
                    query = """
                    SELECT id, rating_avg, trust_score, cleanliness_score, service_score, 
                           food_score, wifi_score, location_score, noise_score, safety_score
                    FROM hotels WHERE name = %s
                    """
                    cur.execute(query, (hotel_name,))
                    h_data = cur.fetchone()
                    
                    if not h_data: continue
                    
                    h_id, rating, trust, *aspects = h_data
                    aspect_names = ['Cleanliness', 'Service', 'Food', 'Wifi', 'Location', 'Noise', 'Safety']
                    
                    # Construct Dynamic Metrics
                    metrics = {"rating": float(rating), "trust_score": float(trust)}
                    if tags:
                        for tag in tags:
                            for idx in TAG_TO_ASPECT_INDICES.get(tag, []):
                                metrics[aspect_names[idx].lower() + "_score"] = float(aspects[idx])

                    # 2. Fetch boosted supporting reviews with parameterized SQL
                    params = [h_id]
                    if boost_keywords:
                        conditions = ["review_text ILIKE %s"] * len(boost_keywords)
                        params.extend([f"%{kw}%" for kw in boost_keywords])
                        k_filter = " AND (" + " OR ".join(conditions) + ")"
                        review_query = f"""
                        SELECT review_text 
                        FROM reviews 
                        WHERE hotel_id = %s {k_filter}
                        ORDER BY embedding <=> %s 
                        LIMIT 2
                        """
                        params.append("[" + ",".join(map(str, query_embedding)) + "]")
                        cur.execute(review_query, params)
                    elif query_embedding:
                        review_query = """
                        SELECT review_text 
                        FROM reviews 
                        WHERE hotel_id = %s AND embedding IS NOT NULL
                        ORDER BY embedding <=> %s 
                        LIMIT 2
                        """
                        cur.execute(review_query, (h_id, "[" + ",".join(map(str, query_embedding)) + "]"))
                    else:
                        review_query = "SELECT review_text FROM reviews WHERE hotel_id = %s LIMIT 2"
                        cur.execute(review_query, (h_id,))

                    # Truncate reviews to be precise
                    reviews = [(r[0][:150] + '...') if len(r[0]) > 150 else r[0] for r in cur.fetchall()]

                    evidence_packet["recommendations"].append({
                        "hotel_name": hotel_name,
                        "score": round(float(score), 2),
                        "metrics": metrics,
                        "reasoning": reasoning,
                        "evidence": reviews,
                        "drawbacks": [aspect_names[i] for i, s in enumerate(aspects) if s < 6.0]
                    })
        finally:
            self._put_conn(conn)
        
        return evidence_packet
