import pandas as pd
import os
import psycopg2
from psycopg2 import extras
from dotenv import load_dotenv
import time

load_dotenv()

# NOTE: For Supabase, get your connection string from Project Settings -> Database -> Connection string (Direct connection)
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def migrate():
    base_path = "C:/Users/tanej/OneDrive/Desktop/TripOn2.0/data/datasets"
    master_file = os.path.join(base_path, "master_indian_hotel_data.csv")
    
    if not os.path.exists(master_file):
        print(f"Error: {master_file} not found. Run scripts/consolidate_data.py first.")
        return

    print(f"Loading data from {master_file}...")
    df = pd.read_csv(master_file)
    
    # Load and merge synthetic data
    synthetic_file = os.path.join(base_path, "synthetic_indian_hotel_data.csv")
    if os.path.exists(synthetic_file):
        print(f"Loading synthetic data from {synthetic_file}...")
        df_synthetic = pd.read_csv(synthetic_file)
        df = pd.concat([df, df_synthetic], ignore_index=True)
    
    # Fill NAs
    df['city'] = df['city'].fillna('Unknown')
    df['province'] = df['province'].fillna('Unknown')
    df['country'] = df['country'].fillna('Unknown')
    df['latitude'] = df['latitude'].fillna(0.0)
    df['longitude'] = df['longitude'].fillna(0.0)
    df['hotel_name'] = df['hotel_name'].fillna('Unknown Hotel')
    df['review_text'] = df['review_text'].fillna('')
    df['rating'] = df['rating'].fillna(0.0)

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Clear existing reviews for a fresh start
        print("Clearing existing reviews for a fresh migration...")
        cur.execute("TRUNCATE reviews RESTART IDENTITY")
        conn.commit()

        # 1. Bulk Insert Locations
        print("Processing locations...")
        unique_locs = df[['city', 'province', 'country']].drop_duplicates()
        loc_data = [tuple(x) for x in unique_locs.values]
        
        insert_loc_query = """
            INSERT INTO locations (city, province, country) 
            VALUES %s 
            ON CONFLICT (city, province, country) DO UPDATE SET city=EXCLUDED.city
            RETURNING id, city, province, country
        """
        extras.execute_values(cur, insert_loc_query, loc_data)
        conn.commit()
        
        cur.execute("SELECT id, city, province, country FROM locations")
        loc_map = {(r[1], r[2], r[3]): r[0] for r in cur.fetchall()}
        
        # 2. Bulk Insert Hotels
        print("Processing hotels...")
        df['location_id'] = df.apply(lambda r: loc_map[(r['city'], r['province'], r['country'])], axis=1)
        unique_hotels = df[['hotel_name', 'location_id', 'latitude', 'longitude']].drop_duplicates(subset=['hotel_name', 'location_id'])
        hotel_data = [tuple(x) for x in unique_hotels.values]
        
        insert_hotel_query = """
            INSERT INTO hotels (name, location_id, latitude, longitude) 
            VALUES %s 
            ON CONFLICT (name, location_id) DO NOTHING
        """
        extras.execute_values(cur, insert_hotel_query, hotel_data)
        conn.commit()
        
        cur.execute("SELECT id, name, location_id FROM hotels")
        hotel_map = {(r[1], r[2]): r[0] for r in cur.fetchall()}
        
        # 3. Bulk Insert Reviews in smaller Chunks
        print("Processing reviews...")
        df['hotel_id'] = df.apply(lambda r: hotel_map.get((r['hotel_name'], r['location_id'])), axis=1)
        df = df[df['hotel_id'].notnull()]
        
        review_data = [
            (int(r['hotel_id']), str(r['review_text']), float(r['rating']), str(r['data_source']))
            for _, r in df.iterrows()
        ]
        
        insert_review_query = "INSERT INTO reviews (hotel_id, review_text, rating, source) VALUES %s"
        
        batch_size = 1000
        for i in range(0, len(review_data), batch_size):
            batch = review_data[i:i + batch_size]
            
            # Robust insertion with retry
            success = False
            retries = 3
            while not success and retries > 0:
                try:
                    extras.execute_values(cur, insert_review_query, batch)
                    conn.commit()
                    success = True
                except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                    print(f"Connection lost, reconnecting... ({e})")
                    time.sleep(2)
                    conn = get_connection()
                    cur = conn.cursor()
                    retries -= 1
            
            if i % 5000 == 0:
                print(f"Inserted {i} reviews...")
            
            # Small sleep to be kind to the server
            time.sleep(0.05)

        print(f"Migration complete! Total reviews: {len(review_data)}")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
