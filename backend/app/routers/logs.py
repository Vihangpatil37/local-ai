"""Usage logs listing endpoint (admin-protected, paginated + filterable)."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import APIKey, UsageLog
from ..schemas import UsageLogList, UsageLogOut
from ..security import require_admin

router = APIRouter(
    prefix="/api/dashboard",
    tags=["logs"],
    dependencies=[Depends(require_admin)],
)


@router.get("/logs", response_model=UsageLogList)
def list_logs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    api_key_id: Optional[int] = None,
    status: Optional[str] = None,
    model: Optional[str] = None,
):
    query = (
        db.query(UsageLog, APIKey.name)
        .outerjoin(APIKey, APIKey.id == UsageLog.api_key_id)
    )

    if api_key_id is not None:
        query = query.filter(UsageLog.api_key_id == api_key_id)
    if status:
        query = query.filter(UsageLog.status == status)
    if model:
        query = query.filter(UsageLog.model == model)

    total = query.count()
    rows = (
        query.order_by(UsageLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [
        UsageLogOut(
            id=log.id,
            api_key_name=key_name,
            model=log.model,
            status=log.status,
            latency_ms=log.latency_ms,
            prompt_preview=log.prompt_preview,
            prompt_tokens=log.prompt_tokens,
            completion_tokens=log.completion_tokens,
            total_tokens=log.total_tokens,
            created_at=log.created_at,
        )
        for log, key_name in rows
    ]

    return UsageLogList(items=items, total=total)
