import json
from rag.engine.hybrid_retriever import HybridRetriever
from rag.engine.evidence_aggregator import EvidenceAggregator
from rag.engine.chat_history import ChatHistory
from rag.engine.models import get_groq_client

class ChatAssistant:
    def __init__(self, retriever: HybridRetriever, aggregator: EvidenceAggregator):
        self.retriever = retriever
        self.aggregator = aggregator
        self.history = ChatHistory()
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

    def _generate_llm_response(self, evidence_packet, user_query):
        """Generates a grounded conversational response using Llama 3 via Groq."""
        
        # Optimize evidence packet for token efficiency
        simplified_evidence = []
        for rec in evidence_packet["recommendations"]:
            simplified_evidence.append({
                "hotel": rec["hotel_name"],
                "metrics": rec["metrics"],
                "reasoning": rec["reasoning"],
                "review_snippet": rec["evidence"][0] if rec["evidence"] else ""
            })
        
        # Prepare messages: System + History + Current Query
        messages = [
            {"role": "system", "content": "You are a helpful travel advisor grounded in factual data metrics. Use the provided evidence packet and conversation history to answer accurately."}
        ]
        messages.extend(self.history.get_messages())
        
        prompt = f"""
        USER QUERY: "{user_query}"

        INSTRUCTIONS:
        1. Use ONLY the provided evidence packet and conversation history.
        2. FOR EACH RECOMMENDATION:
           - Explain WHY the hotel is recommended based on the data.
           - Use the metrics (Rating, Trust Score, Wifi/Noise Scores) to justify the recommendation.
           - Mention specific review evidence.
           - Explicitly mention drawbacks if relevant to the user query.
        3. If no hotels match, state that no information was found.

        EVIDENCE PACKET:
        {json.dumps(simplified_evidence, indent=2)}

        Provide a conversational and helpful response. Use bullet points for recommendations.
        """
        messages.append({"role": "user", "content": prompt})
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
            )
            response = chat_completion.choices[0].message.content
            
            # Update history
            self.history.add_turn(user_query, response)
            
            return response
            
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def chat(self, user_query):
        """Orchestrate the full conversational flow."""
        # 1. Retrieve candidates
        raw_results, query_embedding = self.retriever.search(user_query)
        tags = self.retriever._extract_intent(user_query).get("tags", [])
        
        if isinstance(raw_results, str):
            return raw_results
            
        # 2. Aggregate evidence with semantic relevance and keyword boosting
        evidence_packet = self.aggregator.aggregate(raw_results, query_embedding=query_embedding, tags=tags)
        
        # 3. Generate conversational response
        return self._generate_llm_response(evidence_packet, user_query)

if __name__ == "__main__":
    # Dependency Injection
    retriever = HybridRetriever()
    aggregator = EvidenceAggregator()
    assistant = ChatAssistant(retriever, aggregator)
    
    # Test query
    print(assistant.chat("quiet hotel in Delhi"))
