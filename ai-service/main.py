import os
import json
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
from sentence_transformers import SentenceTransformer, util
import h3

app = FastAPI(title="CivicConnect AI Microservice")

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", "mock_key"))
embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

class TriageRequest(BaseModel):
    raw_text: str

class Candidate(BaseModel):
    id: str
    h3_index: str
    text_embedding: List[float]

class DeduplicateRequest(BaseModel):
    latitude: float
    longitude: float
    description: str
    candidates: List[Candidate]

@app.get("/health")
def health():
    return {"status": "online", "service": "CivicConnect AI Engine"}

@app.post("/api/v1/triage")
def triage(req: TriageRequest):
    prompt = f'Classify: "{req.raw_text}". Return JSON: category, priority, english_translation, suggested_department.'
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return {"category": "Roads", "priority": "High", "english_translation": req.raw_text, "suggested_department": "Municipal Corporation"}

@app.post("/api/v1/deduplicate")
def deduplicate(req: DeduplicateRequest):
    current_h3 = h3.geo_to_h3(req.latitude, req.longitude, 9)
    current_vec = embedder.encode(req.description, convert_to_numpy=True).tolist()
    best_match_id = None
    highest_sim = 0.0

    for candidate in req.candidates:
        if h3.h3_distance(current_h3, candidate.h3_index) <= 1:
            sim = util.cos_sim(current_vec, candidate.text_embedding).item()
            if sim > highest_sim:
                highest_sim = sim
                if sim >= 0.82:
                    best_match_id = candidate.id

    return {
        "is_duplicate": best_match_id is not None,
        "master_ticket_id": best_match_id,
        "similarity_score": round(highest_sim, 3),
        "h3_index": current_h3,
        "embedding": current_vec
    }
