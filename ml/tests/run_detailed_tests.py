from rag.engine.hybrid_retriever import HybridRetriever
import json

def run_detailed_tests():
    retriever = HybridRetriever()
    
    # Expanded multi-regional test queries
    test_queries = [
        "quiet hotel in Chennai",
        "best service in Hyderabad",
        "romantic hotel in Kolkata",
        "good wifi in Pune"
    ]
    
    log_path = "ml/retrieval_validation.log"
    
    results_log = []
    
    print(f"\n--- Running Detailed Retrieval Tests. Logging to {log_path} ---")
    
    for query in test_queries:
        print(f"Testing: {query}")
        results, embedding = retriever.search(query)
        
        query_result = {
            "query": query,
            "results": []
        }
        
        if isinstance(results, str):
            query_result["results"] = results
        else:
            for hotel, reasoning, score in results:
                query_result["results"].append({
                    "hotel": hotel,
                    "score": round(score, 4),
                    "reasoning": reasoning
                })
        
        results_log.append(query_result)
        
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(results_log, f, indent=2)
        
    print("Tests complete. See log in ml/retrieval_validation.log")

if __name__ == "__main__":
    run_detailed_tests()
