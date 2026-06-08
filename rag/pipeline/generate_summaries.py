import psycopg2
from psycopg2 import extras

# Configuration
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "l2hrErFIhdQUMHUx",
    "host": "db.uikfjspwpywhqohppkmb.supabase.co",
    "port": "5432"
}

def generate_summaries():
    print("Generating hotel summaries...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Query hotel data with aspect scores and some sample reviews
    query = """
    SELECT h.id, h.name, h.rating_avg, h.trust_score, 
           h.cleanliness_score, h.service_score, h.food_score,
           (SELECT array_agg(r.review_text) 
            FROM (SELECT review_text FROM reviews WHERE hotel_id = h.id LIMIT 3) r) as sample_reviews
    FROM hotels h
    """
    cur.execute(query)
    hotels = cur.fetchall()
    
    summaries = []
    for h in hotels:
        h_id, name, rating, trust, clean, service, food, reviews = h
        
        # Build structured summary
        summary = (
            f"Hotel: {name}\n"
            f"Overall Rating: {rating}/5.0, Trust Score: {trust}/10.0\n"
            f"Aspects: Cleanliness {clean}/10.0, Service {service}/10.0, Food {food}/10.0\n"
            f"Highlights: " + (", ".join(reviews) if reviews else "No reviews available")
        )
        summaries.append((h_id, summary))
        
    # Insert summaries
    insert_query = "INSERT INTO hotel_summaries (hotel_id, summary) VALUES (%s, %s) ON CONFLICT (hotel_id) DO UPDATE SET summary = EXCLUDED.summary"
    extras.execute_batch(cur, insert_query, summaries)
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Generated and stored summaries for {len(summaries)} hotels.")

if __name__ == "__main__":
    generate_summaries()
