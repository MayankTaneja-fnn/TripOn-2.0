import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

HOTEL_KEYWORDS = [
    'room', 'stay', 'check-in', 'check-out', 'reception', 'lobby', 
    'front desk', 'housekeeping', 'bathroom', 'suite', 'hostel', 
    'resort', 'bed', 'pillow', 'mattress', 'overnight', 'accommodation'
]

FOOD_KEYWORDS = [
    'pizza', 'burger', 'pasta', 'cafe', 'restaurant', 'menu', 
    'waiter', 'steward', 'hummus', 'falafel', 'momo', 'noodles',
    'biryani', 'tandoori', 'scrumptious', 'delicious food', 'yummy',
    'Fatjar', 'Fat Jar'
]

def clean_database(dry_run=True):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # 1. Targeted removal of known mismapped restaurant reviews (like Fatjar)
    cur.execute("SELECT count(*) FROM reviews WHERE review_text ILIKE '%Fatjar%' OR review_text ILIKE '%Fat Jar%'")
    fatjar_count = cur.fetchone()[0]
    
    # 2. Identify reviews with food keywords but NO hotel keywords
    # This is more complex in SQL, so we'll use a specific query pattern
    hotel_like_pattern = '|'.join(HOTEL_KEYWORDS)
    food_like_pattern = '|'.join(FOOD_KEYWORDS)
    
    # Using Postgres POSIX regex for efficient filtering
    identify_query = f"""
    SELECT id, review_text 
    FROM reviews 
    WHERE review_text ~* '({food_like_pattern})' 
      AND NOT (review_text ~* '({hotel_like_pattern})')
    """
    
    cur.execute(identify_query)
    food_only_reviews = cur.fetchall()
    food_only_count = len(food_only_reviews)
    
    print(f"--- Cleaning Analysis ({'DRY RUN' if dry_run else 'LIVE ACTION'}) ---")
    print(f"Targeted 'Fatjar' reviews found: {fatjar_count}")
    print(f"Reviews with food keywords but NO hotel context: {food_only_count}")
    print(f"Total potential deletions: {food_only_count}")
    
    if not dry_run:
        print("Executing deletions...")
        delete_query = f"""
        DELETE FROM reviews 
        WHERE (review_text ~* '({food_like_pattern})' 
          AND NOT (review_text ~* '({hotel_like_pattern})'))
          OR review_text ILIKE '%Fatjar%' 
          OR review_text ILIKE '%Fat Jar%'
        """
        cur.execute(delete_query)
        conn.commit()
        print(f"Successfully deleted {cur.rowcount} mislabeled reviews.")
        
        # After deletion, we should re-aggregate scores since the average ratings might change
        print("Note: You should run 'python scripts/aggregate_scores.py' to update hotel scores.")
    else:
        print("\nSample reviews to be deleted:")
        for _, text in food_only_reviews[:5]:
            print(f"- {text[:150]}...")
            print("-" * 10)

    cur.close()
    conn.close()

if __name__ == "__main__":
    import sys
    is_dry = "--live" not in sys.argv
    clean_database(dry_run=is_dry)
