"""Resolve a user's effective plan + entitlements from their subscription.

Server-side enforcement only — the client is never trusted. A subscription is
honored only while status == "active" AND it has not passed its period end;
anything else falls back to Free.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from . import plans
from .models import Subscription


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    # SQLite round-trips naive datetimes; treat them as UTC for comparison.
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def active_subscription(session: Session, user_id: str) -> Optional[Subscription]:
    sub = session.get(Subscription, user_id)
    if sub is None or sub.status != "active":
        return None
    end = _aware(sub.current_period_end)
    if end is not None and end < datetime.now(timezone.utc):
        return None
    return sub


def effective_plan_id(session: Session, user_id: str) -> str:
    sub = active_subscription(session, user_id)
    return sub.plan_id if sub else plans.FREE


def entitlements_for(session: Session, user_id: str) -> dict:
    return plans.entitlements(effective_plan_id(session, user_id))


def subscription_summary(session: Session, user_id: str) -> Optional[dict]:
    """Serializable subscription info for /v1/me, or None for Free users."""
    sub = active_subscription(session, user_id)
    if sub is None:
        return None
    end = _aware(sub.current_period_end)
    return {
        "plan_id": sub.plan_id,
        "status": sub.status,
        "billing_cycle": sub.billing_cycle,
        "current_period_end": end.isoformat() if end else None,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }
