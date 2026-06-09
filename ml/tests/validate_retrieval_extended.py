from rag.engine.hybrid_retriever import HybridRetriever
import os

def test_multi_region_and_sentiment():
    retriever = HybridRetriever()
    
    # Test queries covering different regions and intent/sentiment
    test_queries = [
        "best family hotel in Delhi",
        "quiet hotel in Mumbai",
        "romantic hotel in Bangalore",
        "good wifi for remote work in Jaipur"
    ]
    
    print("\n--- Multi-Regional & Sentiment Validation Run ---")
    for query in test_queries:
        print(f"\nTesting query: {query}")
        results, _ = retriever.search(query)
        
        if isinstance(results, str):
            print(f"Result: {results}")
        else:
            for hotel, reasoning, score in results:
                print(f"- Hotel: {hotel}, Score: {round(score, 4)}, Reasoning: {reasoning}")

if __name__ == "__main__":
    test_multi_region_and_sentiment()
