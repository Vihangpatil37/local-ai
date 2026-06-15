"""Business logic for recording and querying usage logs."""
from typing import Optional

from sqlalchemy.orm import Session

from ..config import settings
from ..models import APIKey, UsageLog, utcnow


def _build_prompt_preview(messages: list[dict]) -> Optional[str]:
    """Build a truncated, privacy-respecting preview from chat messages."""
    if not settings.log_prompts:
        return None
    last_user = ""
    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            last_user = str(msg.get("content", ""))
    if not last_user and messages:
        last = messages[-1]
        last_user = str(last.get("content", "")) if isinstance(last, dict) else ""
    return last_user[: settings.prompt_preview_chars]


def record_log(
    db: Session,
    *,
    api_key: Optional[APIKey],
    model: str,
    status: str,
    messages: list[dict],
    latency_ms: int,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
    error_message: Optional[str] = None,
) -> UsageLog:
    """Persist a usage log row and update the owning key's counters."""
    log = UsageLog(
        api_key_id=api_key.id if api_key else None,
        model=model,
        status=status,
        prompt_preview=_build_prompt_preview(messages),
        latency_ms=latency_ms,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        error_message=error_message,
    )
    db.add(log)

    if api_key is not None:
        api_key.requests_count = (api_key.requests_count or 0) + 1
        api_key.total_tokens = (api_key.total_tokens or 0) + (total_tokens or 0)
        api_key.last_used_at = utcnow()

    db.commit()
    db.refresh(log)
    return log
