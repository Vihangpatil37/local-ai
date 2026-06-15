"""API key generation/hashing and admin authentication helpers."""
import hashlib
import secrets
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional, Tuple

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import APIKey

# Number of random bytes used for the secret part of a key.
_KEY_RANDOM_BYTES = 24
# How many characters of the full key make up the displayed prefix.
_PREFIX_LEN = 16


def generate_api_key() -> Tuple[str, str, str]:
    """Generate a new API key.

    Returns (full_key, key_hash, key_prefix).
    The full key is shown to the user exactly once and never stored.
    """
    random_part = secrets.token_urlsafe(_KEY_RANDOM_BYTES)
    full_key = f"{settings.api_key_prefix}-{random_part}"
    key_hash = hash_api_key(full_key)
    key_prefix = full_key[:_PREFIX_LEN]
    return full_key, key_hash, key_prefix


def hash_api_key(full_key: str) -> str:
    """SHA-256 hash of the key combined with a secret pepper."""
    data = f"{full_key}{settings.api_key_secret_pepper}".encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def masked_prefix(key_prefix: str) -> str:
    """Display helper: e.g. 'sk-ollama-a82k****'."""
    return f"{key_prefix}****"


# --------- Admin (dashboard) auth ---------
def require_admin(x_admin_password: Optional[str] = Header(default=None)) -> None:
    """Protect dashboard/admin endpoints with a shared password header."""
    if not x_admin_password or not secrets.compare_digest(
        x_admin_password, settings.admin_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin password",
        )


# --------- API key auth (for the proxy) ---------
def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing API key")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Missing API key")
    return parts[1].strip()


# --------- Simple in-memory per-key rate limiter ---------
# Maps key_hash -> deque of request timestamps (monotonic seconds).
_rate_buckets: Dict[str, Deque[float]] = defaultdict(deque)


def _check_rate_limit(key_hash: str) -> None:
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return
    now = time.monotonic()
    window_start = now - 60.0
    bucket = _rate_buckets[key_hash]
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    bucket.append(now)


def authenticate_api_key(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> APIKey:
    """Validate the Bearer API key and enforce per-key rate limiting."""
    token = _extract_bearer(authorization)
    key_hash = hash_api_key(token)

    api_key = db.query(APIKey).filter(APIKey.key_hash == key_hash).first()
    if api_key is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not api_key.active:
        raise HTTPException(status_code=403, detail="API key is disabled")

    _check_rate_limit(key_hash)
    return api_key
