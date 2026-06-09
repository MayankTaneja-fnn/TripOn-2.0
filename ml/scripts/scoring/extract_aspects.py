import os
import json
import psycopg2
from psycopg2.extras import execute_batch
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from dotenv import load_dotenv
import re
import time

load_dotenv()

# Database configuration (Supabase)
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

# Aspect Keywords
ASPECT_KEYWORDS = {
    "cleanliness": ["clean", "dirty", "stain", "dust", "spot", "bathroom", "shower", "linen", "towel", "smell", "hygiene", "tidy"],
    "service": ["staff", "desk", "manager", "service", "helpful", "friendly", "rude", "wait", "check-in", "check-out", "host"],
    "food": ["breakfast", "restaurant", "dinner", "buffet", "delicious", "tasty", "menu", "chef", "eat", "food", "dining"],
    "wifi": ["wifi", "internet", "connection", "signal", "slow", "fast", "speed", "network"],
    "location": ["location", "near", "close", "area", "distance", "central", "view", "scenery", "transport", "airport", "station", "neighborhood"],
    "noise": ["noisy", "loud", "quiet", "sound", "wall", "thin", "street", "sleep", "traffic", "silent"],
    "safety": ["safe", "security", "locks", "dangerous", "guard", "safe", "light", "secure"]
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def analyze_review_aspects(text, analyzer):
    text = text.lower()
    sentences = re.split(r'[.!?]+', text)
    aspect_scores = {}
    
    for aspect, keywords in ASPECT_KEYWORDS.items():
        relevant_sentences = []
        for sentence in sentences:
            if any(kw in sentence for kw in keywords):
                relevant_sentences.append(sentence)
        
        if relevant_sentences:
            # Analyze sentiment of relevant sentences
            scores = []
            for sent in relevant_sentences:
                vs = analyzer.polarity_scores(sent)
                # Convert compound score (-1 to 1) to 1-10 scale
                # (compound + 1) / 2 * 9 + 1
                score_10 = round(((vs['compound'] + 1) / 2) * 9 + 1, 1)
                scores.append(score_10)
            
            aspect_scores[aspect] = round(sum(scores) / len(scores), 1)
            
    return aspect_scores

def process_reviews(total_to_process=1000, batch_size=100):
    print("Initializing Lightweight Rule-Based Aspect Analyzer (VADER)...")
    analyzer = SentimentIntensityAnalyzer()
    
    conn = get_connection()
    cur = conn.cursor()

    try:
        processed_count = 0
        while processed_count < total_to_process:
            cur.execute(
                "SELECT id, review_text FROM reviews WHERE is_processed = FALSE LIMIT %s", 
                (batch_size,)
            )
            rows = cur.fetchall()
            
            if not rows:
                print("No more reviews to process.")
                break

            update_data = []
            for review_id, text in rows:
                if not text:
                    update_data.append((json.dumps({}), review_id))
                    continue
                    
                aspect_scores = analyze_review_aspects(text, analyzer)
                update_data.append((json.dumps(aspect_scores), review_id))

            execute_batch(
                cur,
                "UPDATE reviews SET sentiment_json = %s, is_processed = TRUE WHERE id = %s",
                update_data
            )
            conn.commit()
            
            processed_count += len(rows)
            if processed_count % 1000 == 0 or processed_count == total_to_process:
                print(f"Progress: {processed_count}/{total_to_process} reviews processed.")

    except Exception as e:
        print(f"Error during NLP processing: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    # Process all remaining reviews
    process_reviews(total_to_process=100000, batch_size=2000) 
    print("Lightweight NLP Extraction complete for entire dataset.")
