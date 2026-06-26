from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys

# Ensure ml is in path
sys.path.append(os.path.dirname(__file__))

from rag.engine.chat_assistant import ChatAssistant
from rag.engine.hybrid_retriever import HybridRetriever
from rag.engine.evidence_aggregator import EvidenceAggregator

app = FastAPI()

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Assistant
retriever = HybridRetriever()
aggregator = EvidenceAggregator()
assistant = ChatAssistant(retriever, aggregator)

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    user_id: str
    chat_id: Optional[str] = None

@app.post("/chat")
async def chat(request: ChatRequest):
    print("req received")
    try:
        if not request.message:
            return {"reply": "Please provide a message."}
        
        response = assistant.chat(request.message, user_id=request.user_id, chat_id=request.chat_id)
        return response
    except Exception as e:
        print(f"Error details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
