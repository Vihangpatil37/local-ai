"""Dashboard stats + usage summary endpoints (admin-protected)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import DashboardStats, UsageSummary
from ..security import require_admin
from ..services import stats_service

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return stats_service.get_dashboard_stats(db)


@router.get("/usage", response_model=UsageSummary)
def get_usage(db: Session = Depends(get_db)):
    return stats_service.get_usage_summary(db)
