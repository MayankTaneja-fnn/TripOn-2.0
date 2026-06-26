import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import os
import psycopg2
from psycopg2 import extras
from groq import Groq
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

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_professional_summary(hotel_data, reviews):
    """Uses Llama 3 to generate a professional hotel summary."""
    name, rating, trust, clean, service, food, wifi, loc, noise, safety = hotel_data
    
    prompt = f"""
    You are an expert travel advisor. Analyze the following hotel data and reviews to create a professional, structured summary.
    
    Hotel: {name}
    Rating: {rating}/5.0
    Trust Score: {trust}/10.0
    Aspect Scores (0-10): Cleanliness:{clean}, Service:{service}, Food:{food}, Wifi:{wifi}, Location:{loc}, Noise:{noise}, Safety:{safety}
    
    Reviews (Sample):
    {chr(10).join([f"- {r[:150]}" for r in reviews if r])}
    
    Format the output strictly as follows:
    
    Hotel: {name}
    
    Rating: {rating}/5.0
    Trust Score: {trust}/10.0
    
    Strengths:
    - [List 3-5 concise, professional strengths based on reviews and scores]
    
    Weaknesses:
    - [List 2-3 concise, professional weaknesses if applicable, else 'None reported']
    
    Typical Guests:
    - [Infer 2-3 typical guest types, e.g., Business Travelers, Couples]
    
    Review Highlights:
    - [Provide 3 concise, insightful bullet points summarizing the guest experience, not just metadata]
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional travel data analyst. Provide concise, objective, and structured summaries."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating LLM summary for {name}: {e}")
        return None

def generate_summaries():
    print("Generating LLM-powered hotel summaries...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Increase statement timeout to 5 minutes for this heavy query
    cur.execute("SET statement_timeout = '300s';")
    
    # Query hotel data with aspect scores
    # Uses LATERAL join instead of correlated subquery for better performance
    query = """
    SELECT h.id, h.name, h.rating_avg, h.trust_score, 
           h.cleanliness_score, h.service_score, h.food_score,
           h.wifi_score, h.location_score, h.noise_score, h.safety_score,
           r_agg.sample_reviews
    FROM hotels h
    LEFT JOIN LATERAL (
        SELECT array_agg(sub.review_text) AS sample_reviews
        FROM (SELECT review_text FROM reviews WHERE hotel_id = h.id LIMIT 20) sub
    ) r_agg ON true
    """
    cur.execute(query)
    hotels = cur.fetchall()
    
    summaries = []
    a=0
    for h in hotels:
        h_id, name, rating, trust, clean, service, food, wifi, loc, noise, safety, reviews = h
        if(a <= 150):
            a+=1
            print(f"Skipping {name} since it is already processed...")
            continue
        
        print(f"Generating summary for {name}...")
        
        summary = generate_professional_summary(
            (name, rating, trust, clean, service, food, wifi, loc, noise, safety),
            (reviews or [])
        )
        
        if summary:
            summaries.append((h_id, summary))
        
    # Insert summaries
    insert_query = "INSERT INTO hotel_summaries (hotel_id, summary) VALUES (%s, %s) ON CONFLICT (hotel_id) DO UPDATE SET summary = EXCLUDED.summary"
    extras.execute_batch(cur, insert_query, summaries)
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Generated and stored LLM summaries for {len(summaries)} hotels.")

if __name__ == "__main__":
    generate_summaries()
