import psycopg2
import json

# Configuration
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "l2hrErFIhdQUMHUx",
    "host": "db.uikfjspwpywhqohppkmb.supabase.co",
    "port": "5432"
}

class EvidenceAggregator:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)

    def aggregate(self, recommendations, query_embedding=None):
        """
        Takes raw retrieval results and aggregates supporting evidence.
        recommendations: list of (hotel_name, summary, similarity)
        """
        evidence_packet = {"recommendations": []}
        
        with self.conn.cursor() as cur:
            for hotel_name, summary, similarity in recommendations:
                # 1. Fetch hotel details and aspect scores for drawbacks
                query = """
                SELECT id, cleanliness_score, service_score, food_score, wifi_score, 
                       location_score, noise_score, safety_score
                FROM hotels WHERE name = %s
                """
                cur.execute(query, (hotel_name,))
                h_data = cur.fetchone()
                
                if not h_data: continue
                
                h_id, *aspects = h_data
                aspect_names = ['Cleanliness', 'Service', 'Food', 'Wifi', 'Location', 'Noise', 'Safety']
                
                # Identify drawbacks (aspects < 6.0)
                drawbacks = [aspect_names[i] for i, score in enumerate(aspects) if score < 6.0]
                
                # 2. Fetch supporting reviews (evidence) - Semantically relevant if embedding provided
                if query_embedding:
                    embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
                    review_query = """
                    SELECT review_text 
                    FROM reviews 
                    WHERE hotel_id = %s AND embedding IS NOT NULL
                    ORDER BY embedding <=> %s 
                    LIMIT 3
                    """
                    cur.execute(review_query, (h_id, embedding_str))
                else:
                    review_query = "SELECT review_text FROM reviews WHERE hotel_id = %s LIMIT 3"
                    cur.execute(review_query, (h_id,))
                
                reviews = [r[0] for r in cur.fetchall()]
                
                # 3. Construct Evidence Packet
                evidence_packet["recommendations"].append({
                    "hotel_name": hotel_name,
                    "score": round(float(similarity), 2),
                    "reasoning": summary,
                    "evidence": reviews,
                    "drawbacks": drawbacks
                })
        
        return evidence_packet

    def __del__(self):
        self.conn.close()
