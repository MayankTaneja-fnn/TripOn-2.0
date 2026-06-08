import os
import json
from groq import Groq
from dotenv import load_dotenv
from rag.engine.hybrid_retriever import HybridRetriever
from rag.engine.evidence_aggregator import EvidenceAggregator

load_dotenv()

class ChatAssistant:
    def __init__(self, retriever: HybridRetriever, aggregator: EvidenceAggregator):
        self.retriever = retriever
        self.aggregator = aggregator
        # Initialize Groq client securely
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")
        self.client = Groq(api_key=api_key)

    def _generate_llm_response(self, evidence_packet, user_query):
        """Generates a grounded conversational response using Llama 3 via Groq."""
        
        prompt = f"""
        You are an expert travel advisor for TripOn 2.0. Your goal is to recommend the best hotels from the provided list based on the user's query.

        USER QUERY: "{user_query}"

        INSTRUCTIONS:
        1. Use ONLY the provided evidence below.
        2. For each recommendation, mention the hotel name and specific details found in its "evidence" list.
        3. If there are conflicting reviews (e.g., one says quiet, one says noisy), mention both to provide a balanced view.
        4. Note any "drawbacks" listed for the hotel.
        5. If NONE of the hotels in the evidence packet match the query, only then state that no information was found.

        EVIDENCE PACKET:
        {json.dumps(evidence_packet, indent=2)}

        Provide a conversational and helpful response. Use bullet points for multiple recommendations.
        """
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful travel advisor grounded in factual evidence."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
            )
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def chat(self, user_query):
        """Orchestrate the full conversational flow."""
        # 1. Retrieve candidates
        raw_results, query_embedding = self.retriever.search(user_query)
        
        if isinstance(raw_results, str):
            print(f"DEBUG: Retriever returned string: {raw_results}")
            return raw_results
            
        # 2. Aggregate evidence with semantic relevance
        evidence_packet = self.aggregator.aggregate(raw_results, query_embedding=query_embedding)
        
        print(f"DEBUG: Evidence Packet for '{user_query}':")
        print(json.dumps(evidence_packet, indent=2))
        
        # 3. Generate conversational response
        return self._generate_llm_response(evidence_packet, user_query)

if __name__ == "__main__":
    # Dependency Injection
    retriever = HybridRetriever()
    aggregator = EvidenceAggregator()
    assistant = ChatAssistant(retriever, aggregator)
    
    # Test query
    print(assistant.chat("quiet hotel in Delhi"))
