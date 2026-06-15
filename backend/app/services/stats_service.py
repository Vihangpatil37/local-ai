"""Aggregations for dashboard stats and usage summaries."""
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import settings
from ..models import APIKey, UsageLog
from ..schemas import DashboardStats, UsageByKey, UsageSummary


def _start_of_today_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_dashboard_stats(db: Session) -> DashboardStats:
    today = _start_of_today_utc()

    total_requests = db.query(func.count(UsageLog.id)).scalar() or 0
    requests_today = (
        db.query(func.count(UsageLog.id)).filter(UsageLog.created_at >= today).scalar()
        or 0
    )
    avg_latency = (
        db.query(func.avg(UsageLog.latency_ms))
        .filter(UsageLog.status == "success")
        .scalar()
    )
    active_keys = (
        db.query(func.count(APIKey.id)).filter(APIKey.active.is_(True)).scalar() or 0
    )
    tokens_today = (
        db.query(func.coalesce(func.sum(UsageLog.total_tokens), 0))
        .filter(UsageLog.created_at >= today)
        .scalar()
        or 0
    )
    failed_today = (
        db.query(func.count(UsageLog.id))
        .filter(UsageLog.created_at >= today, UsageLog.status == "error")
        .scalar()
        or 0
    )

    return DashboardStats(
        requests_today=int(requests_today),
        total_requests=int(total_requests),
        average_latency_ms=int(avg_latency or 0),
        active_keys=int(active_keys),
        total_tokens_today=int(tokens_today),
        fake_spend_today=round(int(tokens_today) * settings.fake_cost_per_token, 6),
        failed_requests_today=int(failed_today),
    )


def get_usage_summary(db: Session) -> UsageSummary:
    today = _start_of_today_utc()

    total_tokens = (
        db.query(func.coalesce(func.sum(UsageLog.total_tokens), 0)).scalar() or 0
    )
    total_requests = db.query(func.count(UsageLog.id)).scalar() or 0
    requests_today = (
        db.query(func.count(UsageLog.id)).filter(UsageLog.created_at >= today).scalar()
        or 0
    )

    rows = (
        db.query(
            UsageLog.api_key_id,
            APIKey.name,
            func.count(UsageLog.id),
            func.coalesce(func.sum(UsageLog.total_tokens), 0),
        )
        .outerjoin(APIKey, APIKey.id == UsageLog.api_key_id)
        .group_by(UsageLog.api_key_id, APIKey.name)
        .all()
    )

    by_key = [
        UsageByKey(
            api_key_id=api_key_id,
            api_key_name=name,
            requests=int(req_count),
            total_tokens=int(tok),
            fake_spend=round(int(tok) * settings.fake_cost_per_token, 6),
        )
        for api_key_id, name, req_count, tok in rows
    ]

    return UsageSummary(
        total_tokens=int(total_tokens),
        total_requests=int(total_requests),
        fake_spend=round(int(total_tokens) * settings.fake_cost_per_token, 6),
        requests_today=int(requests_today),
        by_key=by_key,
    )
