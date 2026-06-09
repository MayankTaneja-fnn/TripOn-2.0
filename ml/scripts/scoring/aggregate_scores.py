import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Database configuration (Supabase)
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

def aggregate_scores_sql():
    print("Initializing High-Speed SQL Ranking Engine...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Database connection error: {e}")
        return

    try:
        # Single SQL query to aggregate everything and update the hotels table
        # We calculate the average of each aspect from the sentiment_json
        # and update the trust_score as a simple average of the available aspect scores and the rating
        query = """
        WITH aggregated_reviews AS (
            SELECT 
                hotel_id,
                AVG(rating) as avg_rating,
                AVG(COALESCE(CAST(sentiment_json->>'cleanliness' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'cleanliness' IS NOT NULL) as avg_clean,
                AVG(COALESCE(CAST(sentiment_json->>'service' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'service' IS NOT NULL) as avg_service,
                AVG(COALESCE(CAST(sentiment_json->>'food' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'food' IS NOT NULL) as avg_food,
                AVG(COALESCE(CAST(sentiment_json->>'wifi' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'wifi' IS NOT NULL) as avg_wifi,
                AVG(COALESCE(CAST(sentiment_json->>'location' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'location' IS NOT NULL) as avg_location,
                AVG(COALESCE(CAST(sentiment_json->>'noise' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'noise' IS NOT NULL) as avg_noise,
                AVG(COALESCE(CAST(sentiment_json->>'safety' AS FLOAT), 0)) FILTER (WHERE sentiment_json->>'safety' IS NOT NULL) as avg_safety
            FROM reviews
            WHERE is_processed = TRUE
            GROUP BY hotel_id
        )
        UPDATE hotels h
        SET 
            rating_avg = ROUND(ar.avg_rating::numeric, 2),
            cleanliness_score = ROUND(COALESCE(ar.avg_clean, 6.0)::numeric, 2),
            service_score = ROUND(COALESCE(ar.avg_service, 6.0)::numeric, 2),
            food_score = ROUND(COALESCE(ar.avg_food, 6.0)::numeric, 2),
            wifi_score = ROUND(COALESCE(ar.avg_wifi, 6.0)::numeric, 2),
            location_score = ROUND(COALESCE(ar.avg_location, 6.0)::numeric, 2),
            noise_score = ROUND(COALESCE(ar.avg_noise, 6.0)::numeric, 2),
            safety_score = ROUND(COALESCE(ar.avg_safety, 6.0)::numeric, 2),
            trust_score = ROUND(((ar.avg_rating + (
                COALESCE(ar.avg_clean, 6.0) + 
                COALESCE(ar.avg_service, 6.0) + 
                COALESCE(ar.avg_food, 6.0) + 
                COALESCE(ar.avg_wifi, 6.0) + 
                COALESCE(ar.avg_location, 6.0) + 
                COALESCE(ar.avg_noise, 6.0) + 
                COALESCE(ar.avg_safety, 6.0)
            ) / 14.0) / 2.0)::numeric, 2),
            last_updated = CURRENT_TIMESTAMP
        FROM aggregated_reviews ar
        WHERE h.id = ar.hotel_id;
        """
        
        cur.execute(query)
        conn.commit()
        print("SQL Ranking Engine complete. All hotel profiles updated in record time.")

    except Exception as e:
        print(f"Error during SQL aggregation: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    aggregate_scores_sql()
