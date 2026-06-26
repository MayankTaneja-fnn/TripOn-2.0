import os
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )

def get_user_uuid_from_email(conn, email):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    result = cur.fetchone()
    cur.close()
    return result[0] if result else None

def save_chat_turn(chat_id, user_email, query, response, tag=None):
    """Saves a single chat turn to the chat_history table."""
    conn = None
    try:
        conn = get_db_connection()
        user_uuid = get_user_uuid_from_email(conn, user_email)
        
        if not user_uuid:
            print(f"User with email {user_email} not found.")
            return
            
        cur = conn.cursor()
        
        # Serialize response to JSON if it's a dict
        if isinstance(response, dict):
            reply_content = response.get("reply", "")
            structured_data = response.get("structured_data", None)
        else:
            reply_content = response
            structured_data = None
            
        new_messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": reply_content, "structured_data": structured_data}
        ]
        if tag:
            new_messages.insert(0, {"role": "tag", "content": tag[:50]})
        
        upsert_query = """
        INSERT INTO chat_history (id, user_id, messages)
        VALUES (%s, %s, %s::jsonb)
        ON CONFLICT (id) 
        DO UPDATE SET 
            messages = chat_history.messages || EXCLUDED.messages,
            timestamp = timezone('utc'::text, now());
        """
        
        cur.execute(upsert_query, (chat_id, user_uuid, json.dumps(new_messages)))
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"Error saving chat turn: {e}")
    finally:
        if conn is not None:
            conn.close()

def get_recent_chat_history(chat_id, max_turns=5):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT messages FROM chat_history WHERE id = %s", (chat_id,))
        result = cur.fetchone()
        cur.close()
        
        if result and result[0]:
            messages = result[0]
            # Filter to keep only the last max_turns * 2 items
            if len(messages) > max_turns * 2:
                messages = messages[-(max_turns * 2):]
            
            # Clean up the messages for the LLM prompt
            clean_messages = []
            for m in messages:
                if m.get("role") in ["user", "assistant"]:
                    clean_messages.append({"role": m["role"], "content": m.get("content", "")})
            return clean_messages
        return []
    except Exception as e:
        print(f"Error getting history: {e}")
        return []
    finally:
        if conn is not None:
            conn.close()
