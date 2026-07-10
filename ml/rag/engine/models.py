import os
from dotenv import load_dotenv
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from optimum.onnxruntime import ORTModelForFeatureExtraction, ORTModelForSequenceClassification
from transformers import AutoTokenizer
import numpy as np
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

_model = None
_reranker = None
_groq_client = None

class ONNXEmbeddingModel:
    def __init__(self, model_name="Xenova/all-MiniLM-L6-v2"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = ORTModelForFeatureExtraction.from_pretrained(model_name)
        
    def encode(self, texts, normalize_embeddings=True):
        if isinstance(texts, str):
            texts = [texts]
        inputs = self.tokenizer(texts, padding=True, truncation=True, return_tensors="np")
        outputs = self.model(**inputs)
        
        last_hidden_states = outputs.last_hidden_state
        attention_mask = inputs["attention_mask"]
        
        # Mean pooling
        input_mask_expanded = np.repeat(attention_mask[:, :, np.newaxis], last_hidden_states.shape[-1], axis=-1)
        sum_embeddings = np.sum(last_hidden_states * input_mask_expanded, axis=1)
        sum_mask = np.clip(np.sum(input_mask_expanded, axis=1), a_min=1e-9, a_max=None)
        embeddings = sum_embeddings / sum_mask
        
        if normalize_embeddings:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / norms
            
        return embeddings

class ONNXReranker:
    def __init__(self, model_name="Xenova/ms-marco-MiniLM-L-6-v2"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = ORTModelForSequenceClassification.from_pretrained(model_name)
        
    def predict(self, pairs):
        inputs = self.tokenizer(pairs, padding=True, truncation=True, return_tensors="np")
        outputs = self.model(**inputs)
        
        logits = outputs.logits
        if logits.shape[1] == 1:
            return logits.flatten()
        else:
            return logits[:, 1]

def get_model():
    global _model
    if _model is None:
        _model = ONNXEmbeddingModel()
    return _model

def get_reranker():
    global _reranker
    if _reranker is None:
        _reranker = ONNXReranker()
    return _reranker
def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client
