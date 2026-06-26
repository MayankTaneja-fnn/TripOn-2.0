import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import os
import time
import csv
import psycopg2
from psycopg2 import extras
from sentence_transformers import SentenceTransformer
import psutil
from dotenv import load_dotenv

load_dotenv()

# Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}
BATCH_SIZE = 500
METRICS_FILE = "docs/embedding_metrics.csv"

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def log_metrics(batch_num, count, duration, mem_usage):
    # Ensure directory exists
    os.makedirs(os.path.dirname(METRICS_FILE), exist_ok=True)
    
    file_exists = os.path.isfile(METRICS_FILE)
    with open(METRICS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['Batch Number', 'Reviews Processed', 'Time Taken (s)', 'Embeddings/sec', 'Memory Usage (MB)'])
        writer.writerow([batch_num, count, f"{duration:.2f}", f"{count/duration:.2f}", f"{mem_usage:.2f}"])

def generate_embeddings():
    print("Initializing PGVector Embedding Pipeline...")
    
    # Load Model
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    
    # Query Data: Only fetch reviews that don't have embeddings yet
    query = """
    SELECT r.id, r.review_text, h.name, l.city,
           h.cleanliness_score, h.wifi_score, h.noise_score
    FROM reviews r
    JOIN hotels h ON r.hotel_id = h.id
    JOIN locations l ON h.location_id = l.id
    WHERE r.embedding IS NULL
    """
    
    batch_num = 1
    
    while True:
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(query + f" LIMIT {BATCH_SIZE}")
            batch = cur.fetchall()
            
            if not batch:
                print("All reviews processed.")
                break
                
            start_time = time.time()
            
            review_ids = []
            documents = []
            
            for row in batch:
                r_id, text, h_name, city, clean, wifi, noise = row
                
                # Filter low-value reviews
                if len(text.split()) < 3:
                    # Skip processing
                    continue
                    
                review_ids.append(r_id)
                documents.append(f"Review:\n{text}\n\nHotel:\n{h_name}\n\nCity:\n{city}\n\nCleanliness: {clean}\nWifi: {wifi}\nNoise: {noise}")
            
            if documents:
                # Generate Embeddings
                embeddings = model.encode(
                    documents,
                    batch_size=64,
                    show_progress_bar=False,
                    normalize_embeddings=True
                ).tolist()
                
                # Update PostgreSQL with pgvector
                update_data = [(embedding, r_id) for r_id, embedding in zip(review_ids, embeddings)]
                update_query = "UPDATE reviews SET embedding = %s WHERE id = %s"
                extras.execute_batch(cur, update_query, update_data)
            
            conn.commit()
            
            duration = time.time() - start_time
            mem_usage = psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
            
            log_metrics(batch_num, len(batch), duration, mem_usage)
            print(f"Batch {batch_num} processed. Time: {duration:.2f}s. Mem: {mem_usage:.2f}MB")
            batch_num += 1
            
            cur.close()
            conn.close()
            
        except Exception as e:
            print(f"Error in batch {batch_num}: {e}")
            time.sleep(5) # Wait before retry
            if 'conn' in locals() and conn:
                conn.close()
            continue

    print("Embedding generation complete.")

if __name__ == "__main__":
    generate_embeddings()
