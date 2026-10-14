from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx
from app.database import get_db
from app.schemas import AIQueryRequest, AIQueryResponse
from app.services.ollama_service import OllamaService
from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL

router = APIRouter(prefix="/ai", tags=["AI Extension (Ollama)"])


@router.post(
    "/query",
    response_model=AIQueryResponse,
    summary="Natural Language Query via Ollama AI",
    description=(
        "Ask natural language questions about students (e.g. 'How many students are there?' "
        "or 'List students born after 2005'). Database records are safely retrieved in the backend "
        "and provided as context to Ollama."
    ),
)
async def query_student_ai(query: AIQueryRequest, db: Session = Depends(get_db)):
    result = await OllamaService.ask_question(query.question, db)
    return AIQueryResponse(
        question=result["question"],
        answer=result["answer"],
        model_used=result["model_used"],
        records_referenced=result["records_referenced"],
        source=result["source"],
    )


@router.get(
    "/status",
    summary="Ollama Connection Status",
    description="Check whether the local Ollama daemon is reachable.",
)
async def check_ollama_status():
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                return {
                    "status": "connected",
                    "ollama_url": OLLAMA_BASE_URL,
                    "target_model": OLLAMA_MODEL,
                    "installed_models": models,
                    "is_target_model_installed": any(OLLAMA_MODEL in m for m in models),
                }
    except Exception as e:
        return {
            "status": "offline_or_unreachable",
            "ollama_url": OLLAMA_BASE_URL,
            "target_model": OLLAMA_MODEL,
            "fallback_active": True,
            "message": "Local Ollama server is not running. Grounded heuristic answering engine is active.",
            "error_detail": str(e),
        }
