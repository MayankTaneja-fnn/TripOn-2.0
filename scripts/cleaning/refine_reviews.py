import psycopg2
import re

DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "l2hrErFIhdQUMHUx",
    "host": "db.uikfjspwpywhqohppkmb.supabase.co",
    "port": "5432"
}

def refine_reviews(dry_run=True):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print(f"--- Review Refinement ({'DRY RUN' if dry_run else 'LIVE ACTION'}) ---")

    # 1. Remove Excel errors (#NAME?)
    cur.execute("SELECT COUNT(*) FROM reviews WHERE review_text LIKE '%#NAME?%'")
    name_error_count = cur.fetchone()[0]
    
    # 2. Remove very short reviews (< 30 chars) - usually low value for RAG
    cur.execute("SELECT COUNT(*) FROM reviews WHERE LENGTH(review_text) < 30")
    short_count = cur.fetchone()[0]

    # 3. Deduplicate (Identical text)
    # This query identifies how many rows would be removed to leave 1 unique text per hotel
    cur.execute("""
        SELECT COUNT(*) FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY review_text ORDER BY id) as rn
            FROM reviews
        ) t WHERE rn > 1
    """)
    dup_count = cur.fetchone()[0]

    print(f"1. Excel Errors (#NAME?) to remove: {name_error_count}")
    print(f"2. Short reviews (<30 chars) to remove: {short_count}")
    print(f"3. Duplicate reviews to remove: {dup_count}")

    if not dry_run:
        # Delete Errors
        cur.execute("DELETE FROM reviews WHERE review_text LIKE '%#NAME?%'")
        # Delete Short
        cur.execute("DELETE FROM reviews WHERE LENGTH(review_text) < 30")
        # Delete Duplicates (keeping the first one)
        cur.execute("""
            DELETE FROM reviews 
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY review_text ORDER BY id) as rn
                    FROM reviews
                ) t WHERE rn > 1
            )
        """)
        
        # 4. Text Cleaning (Whitespace and basic artifacts)
        # We can do this in SQL for efficiency
        cur.execute("""
            UPDATE reviews 
            SET review_text = TRIM(REGEXP_REPLACE(review_text, '\s+', ' ', 'g'))
            WHERE review_text ~ '\s{2,}'
        """)
        
        conn.commit()
        print("\nRefinement complete.")
        print("Note: You should run 'python scripts/aggregate_scores.py' and 'rag/generate_embeddings.py' after this.")
    else:
        print("\nNo changes made in dry run.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    import sys
    is_dry = "--live" not in sys.argv
    refine_reviews(dry_run=is_dry)
