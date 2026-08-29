import os
import sys
import uuid
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import json
from rag.engine.hybrid_retriever import HybridRetriever
from rag.engine.evidence_aggregator import EvidenceAggregator
from rag.engine.models import get_groq_client
from rag.engine.db_helper import save_chat_turn, get_recent_chat_history

class ChatAssistant:
    def __init__(self, retriever: HybridRetriever, aggregator: EvidenceAggregator):
        self.retriever = retriever
        self.aggregator = aggregator
        self.client = get_groq_client()

    def explain_recommendation(self, hotel_name):
        """Returns the breakdown of why a hotel has a specific trust score."""
        return self.aggregator.get_metric_breakdown(hotel_name)

    def compare_hotels(self, hotel1_name, hotel2_name):
        """Compares two hotels side-by-side."""
        h1 = self.aggregator.get_hotel_details(hotel1_name)
        h2 = self.aggregator.get_hotel_details(hotel2_name)
        
        if not h1 or not h2:
            return "Could not find one or both hotels for comparison."
            
        return {
            "comparison": [h1, h2]
        }

    def _generate_llm_response(self, evidence_packet, user_query, chat_id):
        """Generates a grounded conversational response using Llama 3 via Groq with Markdown formatting."""
        
        # Optimize evidence packet for token efficiency
        simplified_evidence = []
        if evidence_packet:
            for rec in evidence_packet["recommendations"]:
                simplified_evidence.append({
                    "hotel_name": rec["hotel_name"]
                })
        
        # Prepare messages: System + History + Current Query
        messages = [
            {"role": "system", "content": """You are a highly professional and concise travel advisor.
CRITICAL RULE: The system has already found the hotels and is displaying them in detailed UI cards to the user.
YOU MUST NOT list the hotels. YOU MUST NOT mention their names, scores, metrics, or evidence.
YOUR ONLY JOB is to write a single, short introductory sentence (e.g. "Here are the top options that match your preferences:")
IF YOU USE BULLET POINTS OR LIST HOTEL NAMES, YOU WILL BE PENALIZED."""}
        ]
        
        history = get_recent_chat_history(chat_id, max_turns=5)
        messages.extend(history)
        
        prompt = f"""
        USER QUERY: "{user_query}"

        Note: The UI will display the hotels automatically. 
        DO NOT list them in your response. Just write a 1-sentence intro acknowledging their request.
        """
        messages.append({"role": "user", "content": prompt})
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="openai/gpt-oss-120b",
            )
            response = chat_completion.choices[0].message.content
            
            # Return both conversational response and structured data for UI rendering
            return {
                "reply": response,
                "structured_data": evidence_packet["recommendations"] if evidence_packet and "recommendations" in evidence_packet else None
            }
            
        except Exception as e:
            return {"reply": f"Error generating response: {str(e)}"}

    def chat(self, user_query, user_id, chat_id=None):
        """Orchestrate the full conversational flow and persist interactions."""
        if chat_id is None:
            chat_id = str(uuid.uuid4())
            
        # Check if new chat to generate tag
        history = get_recent_chat_history(chat_id, max_turns=1)
        is_new_chat = len(history) == 0
        tag = None
        
        if is_new_chat:
            try:
                title_res = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": f"Generate a short, maximum 50-character relevant tag or title for this travel query: '{user_query}'. Return ONLY the tag string, no quotes, no extra text."}],
                    temperature=0.3
                )
                tag = title_res.choices[0].message.content.strip('"\'')
            except Exception as e:
                print(f"Error generating tag: {e}")
            
        # 1. Retrieve candidates
        raw_results, query_embedding = self.retriever.search(user_query)
        tags = self.retriever._extract_intent(user_query).get("tags", [])
        
        if isinstance(raw_results, str):
            save_chat_turn(chat_id, user_id, user_query, raw_results, tag=tag)
            return {"reply": raw_results, "chat_id": chat_id}
            
        # 2. Aggregate evidence
        evidence_packet = self.aggregator.aggregate(raw_results, query=user_query, query_embedding=query_embedding, tags=tags)
        
        # 3. Generate conversational response
        response = self._generate_llm_response(evidence_packet, user_query, chat_id)
        
        # 4. Persist to DB
        save_chat_turn(chat_id, user_id, user_query, response, tag=tag)
        
        return {"reply": response["reply"], "structured_data": response.get("structured_data"), "chat_id": chat_id}

if __name__ == "__main__":
    print("This script is not intended for direct interactive use.")
    print("Please run the API server (e.g., 'python ml/api.py') to interface with the frontend.")
