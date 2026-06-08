import psycopg2
from sentence_transformers import SentenceTransformer
import json

# Configuration
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "l2hrErFIhdQUMHUx",
    "host": "db.uikfjspwpywhqohppkmb.supabase.co",
    "port": "5432"
}

def validate_retrieval():
    print("Initializing Retrieval Validation Script...")
    
    # Load Model
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    test_queries = [
        "romantic hotel",
        "good wifi",
        "quiet rooms",
        "great breakfast",
        "remote work"
    ]
    
    for query_text in test_queries:
        print(f"\n--- Query: {query_text} ---")
        
        # 1. Encode query
        query_embedding = model.encode(query_text, normalize_embeddings=True).tolist()
        
        # 2. Search using pgvector cosine similarity (1 - distance)
        # Convert list to string representation for pgvector
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        search_query = """
        SELECT r.review_text, h.name, l.city, 1 - (r.embedding <=> %s) AS similarity
        FROM reviews r
        JOIN hotels h ON r.hotel_id = h.id
        JOIN locations l ON h.location_id = l.id
        WHERE r.embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 3
        """
        
        cur.execute(search_query, (embedding_str,))
        results = cur.fetchall()
        
        for i, res in enumerate(results):
            text, h_name, city, sim = res
            print(f"Result {i+1} (Sim: {sim:.4f}):")
            print(f"Hotel: {h_name}, City: {city}")
            print(f"Review: {text[:150]}...")
            print("-" * 20)
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    validate_retrieval()
