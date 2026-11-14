"""Servidor API REST para el Asistente RAG con IVF y Cubo OLAP.

Ejecuta un servidor FastAPI con soporte CORS para comunicarse con el frontend
de la aplicación web ('Flame in Freefall').

Endpoints:
- POST /api/rag/query           -> Ejecuta búsqueda IVF + Cruce OLAP + Gemma 3 12B
- GET  /api/rag/status          -> Estado de Bedrock, IVF y base OLAP
- GET  /api/rag/sample_prompts  -> Preguntas recomendadas para la demo

Uso:
    python scripts/rag_api_server.py
"""
import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from scripts.rag_service import FreefallRAGService, GEMMA_MODEL_ID, EMBED_MODEL_ID

app = FastAPI(title="Flame in Freefall RAG API", version="1.0.0")

# Permitir CORS para Vite (localhost:5173) y cualquier origen local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = None


def get_service():
    global rag_service
    if rag_service is None:
        rag_service = FreefallRAGService()
    return rag_service


class QueryRequest(BaseModel):
    question: str
    n_probe: int = 3
    top_k: int = 3


@app.get("/api/rag/status")
def get_status():
    service = get_service()
    has_ivf = service.ivf_index is not None
    return {
        "status": "online",
        "embedding_model": EMBED_MODEL_ID,
        "llm_model": GEMMA_MODEL_ID,
        "ivf_index_loaded": has_ivf,
        "total_documents": len(service.ivf_index.documents) if has_ivf else 0,
        "n_clusters": service.ivf_index.metadata.get("n_clusters", 0) if has_ivf else 0,
        "foreign_key": "titulo_paper",
        "olap_database": "data/olap_experimentos.db"
    }


@app.get("/api/rag/sample_prompts")
def get_sample_prompts():
    return [
        {
            "id": 1,
            "title": "Silicone in Saffire-II vs Earth 1g",
            "prompt": "Why did silicone self-extinguish in microgravity during Saffire-II while burning completely in 1g tests on Earth?"
        },
        {
            "id": 2,
            "title": "Heptane Droplets & Cool Flames (FLEX)",
            "prompt": "What did the FLEX experiment on the ISS observe regarding heptane droplet extinction and cool flame behavior?"
        },
        {
            "id": 3,
            "title": "Exploration Atmosphere (0.57 atm / 34% O2)",
            "prompt": "What fire safety risks exist in proposed exploration atmospheres at 0.57 atm and 34% oxygen based on NASA spaceflight tests?"
        },
        {
            "id": 4,
            "title": "SIBAL Fabric vs PMMA Spread Rate",
            "prompt": "How does the flame spread rate of SIBAL fabric compare to PMMA acrylic under forced concurrent flow of 20 cm/s in orbit?"
        }
    ]


@app.post("/api/rag/verify_claim")
def verify_claim_endpoint(req: QueryRequest):
    service = get_service()
    return service.claim_verifier.verify_statement(req.question.strip())


@app.post("/api/rag/query")
def run_rag_query(req: QueryRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Query question cannot be empty.")

    service = get_service()
    try:
        response = service.ask(req.question.strip(), n_probe=req.n_probe, top_k=req.top_k)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing RAG query: {str(e)}")


def main():
    print("Starting FastAPI RAG server on http://127.0.0.1:5005 ...")
    uvicorn.run("scripts.rag_api_server:app", host="127.0.0.1", port=5005, reload=False)


if __name__ == "__main__":
    main()
