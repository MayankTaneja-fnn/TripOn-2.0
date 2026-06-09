import os
import psycopg2
from psycopg2 import extras
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import time
import psutil

load_dotenv()

# Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}
BATCH_SIZE = 100 # Smaller batch for summaries

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def generate_summary_embeddings():
    print("Initializing Summary Embedding Pipeline...")
    
    # Load Model
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Query Data: Fetch summaries that don't have embeddings
    query = "SELECT hotel_id, summary FROM hotel_summaries WHERE embedding IS NULL"
    cur.execute(query)
    
    processed_count = 0
    
    while True:
        batch = cur.fetchmany(BATCH_SIZE)
        if not batch:
            break
            
        start_time = time.time()
        
        # Prepare Data
        hotel_ids = []
        documents = []
        
        for row in batch:
            h_id, summary_text = row
            hotel_ids.append(h_id)
            documents.append(summary_text)
        
        # Generate Embeddings
        embeddings = model.encode(
            documents,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True
        ).tolist()
        
        # Update PostgreSQL
        update_data = [(embedding, h_id) for h_id, embedding in zip(hotel_ids, embeddings)]
        update_query = "UPDATE hotel_summaries SET embedding = %s WHERE hotel_id = %s"
        
        with conn.cursor() as update_cur:
            extras.execute_batch(update_cur, update_query, update_data)
        conn.commit()
        
        duration = time.time() - start_time
        processed_count += len(batch)
        print(f"Processed {processed_count} summaries. Batch time: {duration:.2f}s")
        
    cur.close()
    conn.close()
    print("Summary embedding generation complete.")

if __name__ == "__main__":
    generate_summary_embeddings()
