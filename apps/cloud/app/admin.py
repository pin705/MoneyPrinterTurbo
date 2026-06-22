"""Admin endpoints — users, manual credit adjustments, revenue stats.

Authenticated by a static admin key (X-Admin-Key header == ADMIN_API_KEY). If
ADMIN_API_KEY is unset, every admin request is rejected (secure by default).
Never expose this without the key, and never reuse a user JWT here.
"""
import os
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, func, select

from . import plans, subscriptions
from .credits import InsufficientCredits, debit_credits, get_balance, grant_credits
from .db import get_session
from .models import CreditBalance, Order, Subscription, User

router = APIRouter(prefix="/v1/admin", tags=["admin"])

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")


def require_admin(x_admin_key: str = Header(default="")) -> None:
    if not ADMIN_API_KEY or not secrets.compare_digest(x_admin_key, ADMIN_API_KEY):
        raise HTTPException(403, "admin only")


@router.get("/users", dependencies=[Depends(require_admin)])
def list_users(session: Session = Depends(get_session), limit: int = 100):
    users = session.exec(select(User).limit(limit)).all()
    out = []
    for u in users:
        out.append(
            {
                "id": u.id,
                "email": u.email,
                "credits": get_balance(session, u.id),
                "plan_id": subscriptions.effective_plan_id(session, u.id),
                "created_at": u.created_at.isoformat(),
            }
        )
    return {"users": out}


class _Adjust(dict):
    pass


@router.post("/credits", dependencies=[Depends(require_admin)])
def adjust_credits(body: dict, session: Session = Depends(get_session)):
    """Grant (delta>0) or deduct (delta<0) credits for a user, with an audit reason."""
    user_id = str(body.get("user_id") or "")
    delta = int(body.get("delta") or 0)
    reason = str(body.get("reason") or "admin")
    if not user_id or delta == 0:
        raise HTTPException(400, "user_id and non-zero delta required")
    if session.get(User, user_id) is None:
        raise HTTPException(404, "user not found")
    if delta > 0:
        balance = grant_credits(session, user_id, delta, reason=f"admin:{reason}")
    else:
        try:
            balance = debit_credits(session, user_id, -delta, reason=f"admin:{reason}")
        except InsufficientCredits:
            raise HTTPException(400, "insufficient balance to deduct")
    return {"user_id": user_id, "balance": balance}


@router.get("/stats", dependencies=[Depends(require_admin)])
def stats(session: Session = Depends(get_session)):
    users = session.exec(select(func.count()).select_from(User)).one()
    active_subs = session.exec(
        select(func.count()).select_from(Subscription).where(Subscription.status == "active")
    ).one()
    credits_outstanding = (
        session.exec(select(func.coalesce(func.sum(CreditBalance.balance), 0))).one()
    )
    paid = session.exec(select(Order).where(Order.status == "paid")).all()
    revenue = sum(o.amount_vnd for o in paid)
    return {
        "users": int(users),
        "active_subscriptions": int(active_subs),
        "credits_outstanding": int(credits_outstanding),
        "paid_orders": len(paid),
        "revenue_vnd": int(revenue),
    }
