"""API key management endpoints (admin-protected)."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ApiKeyOut, CreateApiKeyRequest, CreateApiKeyResponse
from ..security import require_admin
from ..services import api_key_service

router = APIRouter(
    prefix="/api/dashboard/keys",
    tags=["keys"],
    dependencies=[Depends(require_admin)],
)


@router.post("", response_model=CreateApiKeyResponse)
def create_key(body: CreateApiKeyRequest, db: Session = Depends(get_db)):
    api_key, full_key = api_key_service.create_key(db, body.name)
    return CreateApiKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        full_key=full_key,  # shown only once
        created_at=api_key.created_at,
    )


@router.get("", response_model=List[ApiKeyOut])
def list_keys(db: Session = Depends(get_db)):
    return api_key_service.list_keys(db)


@router.patch("/{key_id}/disable", response_model=ApiKeyOut)
def disable_key(key_id: int, db: Session = Depends(get_db)):
    api_key = api_key_service.disable_key(db, key_id)
    if api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")
    return api_key


@router.delete("/{key_id}", response_model=ApiKeyOut)
def delete_key(key_id: int, db: Session = Depends(get_db)):
    # Soft-delete keeps logs intact (active = false).
    api_key = api_key_service.soft_delete_key(db, key_id)
    if api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")
    return api_key
