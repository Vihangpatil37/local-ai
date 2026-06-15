"""OpenAI-compatible chat proxy: validates key -> forwards to Ollama -> logs."""
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import APIKey
from ..ollama_client import OllamaError, chat_completion
from ..schemas import ChatCompletionRequest
from ..security import authenticate_api_key
from ..services import usage_service

router = APIRouter(prefix="/v1", tags=["proxy"])


def _extract_usage(ollama_response: dict) -> tuple[int, int, int]:
    usage = ollama_response.get("usage") or {}
    prompt = int(usage.get("prompt_tokens", 0) or 0)
    completion = int(usage.get("completion_tokens", 0) or 0)
    total = int(usage.get("total_tokens", 0) or (prompt + completion))
    return prompt, completion, total


@router.post("/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(authenticate_api_key),
):
    model = body.model or settings.ollama_default_model
    # Build a clean OpenAI-style payload for Ollama (streaming not supported in v1).
    messages = [m.model_dump() for m in body.messages]
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }
    # Pass through any extra options (temperature, etc.).
    extra = body.model_dump(exclude={"model", "messages", "stream"}, exclude_none=True)
    payload.update(extra)

    start = time.monotonic()
    try:
        ollama_response = await chat_completion(payload)
    except OllamaError as exc:
        latency_ms = int((time.monotonic() - start) * 1000)
        usage_service.record_log(
            db,
            api_key=api_key,
            model=model,
            status="error",
            messages=messages,
            latency_ms=latency_ms,
            error_message=exc.detail,
        )
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    latency_ms = int((time.monotonic() - start) * 1000)
    prompt_tokens, completion_tokens, total_tokens = _extract_usage(ollama_response)

    usage_service.record_log(
        db,
        api_key=api_key,
        model=model,
        status="success",
        messages=messages,
        latency_ms=latency_ms,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )

    # Normalize into an OpenAI-style response (Ollama's /v1 already is, but we
    # guarantee the shape and stamp our own id/created/model values).
    choices = ollama_response.get("choices") or [
        {
            "index": 0,
            "message": {"role": "assistant", "content": ""},
            "finish_reason": "stop",
        }
    ]
    return {
        "id": ollama_response.get("id", "chatcmpl-local"),
        "object": "chat.completion",
        "created": ollama_response.get(
            "created", int(datetime.now(timezone.utc).timestamp())
        ),
        "model": model,
        "choices": choices,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
        },
    }
