import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.engine.hybrid_retriever import HybridRetriever
from rag.engine.evidence_aggregator import EvidenceAggregator
from rag.engine.chat_assistant import ChatAssistant
import os
import json

def test_assistant():
    # Dependency Injection
    retriever = HybridRetriever()
    aggregator = EvidenceAggregator()
    assistant = ChatAssistant(retriever, aggregator)
    
    test_queries = [
        "romantic hotel in Delhi",
        "good wifi for remote work in Delhi",
        "quiet rooms in Delhi"
    ]
    
    log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "chat_validation_log.txt")
    
    with open(log_file, "a", encoding="utf-8") as f:
        f.write("\n--- Chat Assistant Validation Run ---\n")
        
        for query in test_queries:
            print(f"Testing query: {query}")
            response = assistant.chat(query, user_id="test_user")
            
            log_entry = {
                "query": query,
                "response": response
            }
            
            f.write(json.dumps(log_entry, indent=2) + "\n")
            print(f"Response logged.\n")

if __name__ == "__main__":
    # Ensure environment variable is set
    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY not set.")
    else:
        test_assistant()
        print("Validation complete. Check docs/chat_validation_log.txt")
