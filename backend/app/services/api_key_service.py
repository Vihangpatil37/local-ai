"""Business logic for API key management."""
from typing import List

from sqlalchemy.orm import Session

from ..models import APIKey
from ..security import generate_api_key


def create_key(db: Session, name: str) -> tuple[APIKey, str]:
    """Create a new API key. Returns (db_object, full_key).

    The full key is returned to the caller so it can be shown once and
    is never persisted.
    """
    full_key, key_hash, key_prefix = generate_api_key()
    api_key = APIKey(name=name, key_hash=key_hash, key_prefix=key_prefix, active=True)
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, full_key


def list_keys(db: Session) -> List[APIKey]:
    return db.query(APIKey).order_by(APIKey.created_at.desc()).all()


def get_key(db: Session, key_id: int) -> APIKey | None:
    return db.query(APIKey).filter(APIKey.id == key_id).first()


def disable_key(db: Session, key_id: int) -> APIKey | None:
    api_key = get_key(db, key_id)
    if api_key is None:
        return None
    api_key.active = False
    db.commit()
    db.refresh(api_key)
    return api_key


def soft_delete_key(db: Session, key_id: int) -> APIKey | None:
    """Soft-delete: mark inactive but keep logs intact."""
    return disable_key(db, key_id)
