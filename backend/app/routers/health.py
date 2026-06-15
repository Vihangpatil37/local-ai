"""Health check endpoint."""
from fastapi import APIRouter

from ..ollama_client import check_health
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    ollama_ok = await check_health()
    return HealthResponse(
        status="ok",
        ollama="connected" if ollama_ok else "disconnected",
    )
