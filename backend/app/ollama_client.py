"""Thin client that forwards chat requests to local Ollama.

Uses Ollama's OpenAI-compatible endpoint (/v1/chat/completions) as the
preferred path, with a fallback to the native /api/chat endpoint.
"""
from typing import Any, Dict

import httpx

from .config import settings


class OllamaError(Exception):
    """Raised when Ollama cannot fulfil a request.

    `status_code` is the HTTP status to surface to the client and
    `detail` is the user-facing message.
    """

    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


async def check_health() -> bool:
    """Return True if Ollama responds on its base URL."""
    url = f"{settings.ollama_base_url}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            return resp.status_code == 200
    except httpx.HTTPError:
        return False


def _map_error(exc: httpx.HTTPStatusError) -> OllamaError:
    text = exc.response.text.lower()
    if exc.response.status_code == 404 and ("model" in text or "not found" in text):
        return OllamaError(
            "Model not found. Pull the model using ollama pull MODEL_NAME.",
            status_code=404,
        )
    return OllamaError(
        f"Ollama returned an error: {exc.response.status_code}",
        status_code=502,
    )


async def chat_completion(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Forward an OpenAI-style chat payload to Ollama and return its JSON.

    The payload is expected to already be in OpenAI chat format
    ({"model", "messages", "stream": False, ...}).
    """
    url = f"{settings.ollama_base_url}/v1/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
    except httpx.ConnectError as exc:
        raise OllamaError(
            "Ollama is not reachable. Make sure Ollama is running on the owner's laptop.",
            status_code=503,
        ) from exc
    except httpx.TimeoutException as exc:
        raise OllamaError("Ollama request timed out.", status_code=504) from exc
    except httpx.HTTPStatusError as exc:
        raise _map_error(exc) from exc
    except httpx.HTTPError as exc:  # catch-all for other transport errors
        raise OllamaError(
            "Ollama is not reachable. Make sure Ollama is running on the owner's laptop.",
            status_code=503,
        ) from exc
