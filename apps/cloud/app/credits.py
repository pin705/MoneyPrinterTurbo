"""Credit ledger operations.

All enforcement lives here on the server — the desktop client is never trusted.
Debits lock the balance row (`SELECT … FOR UPDATE` on Postgres) so concurrent
requests can't overspend.
"""
from datetime import datetime, timezone

from sqlmodel import Session, select

from .models import CreditBalance, CreditTransaction, UsageLog


class InsufficientCredits(Exception):
    pass


def get_balance(session: Session, user_id: str) -> int:
    row = session.get(CreditBalance, user_id)
    return row.balance if row else 0


def _locked_balance(session: Session, user_id: str) -> CreditBalance:
    row = session.exec(
        select(CreditBalance).where(CreditBalance.user_id == user_id).with_for_update()
    ).one_or_none()
    if row is None:
        row = CreditBalance(user_id=user_id, balance=0)
        session.add(row)
        session.flush()
    return row


def grant_credits(
    session: Session, user_id: str, amount: int, reason: str, ref: str | None = None
) -> int:
    """Add credits (signup grant / top-up). Idempotent when `ref` is reused."""
    if ref:
        seen = session.exec(
            select(CreditTransaction).where(CreditTransaction.ref == ref)
        ).first()
        if seen:
            return get_balance(session, user_id)

    row = _locked_balance(session, user_id)
    row.balance += amount
    row.updated_at = datetime.now(timezone.utc)
    session.add(CreditTransaction(user_id=user_id, delta=amount, reason=reason, ref=ref))
    session.commit()
    return row.balance


def debit_credits(
    session: Session, user_id: str, amount: int, reason: str, ref: str | None = None
) -> int:
    """Spend credits atomically. Raises InsufficientCredits if the balance is low."""
    row = _locked_balance(session, user_id)
    if row.balance < amount:
        session.rollback()
        raise InsufficientCredits()
    row.balance -= amount
    row.updated_at = datetime.now(timezone.utc)
    session.add(
        CreditTransaction(user_id=user_id, delta=-amount, reason=reason, ref=ref)
    )
    session.commit()
    return row.balance


def log_usage(
    session: Session,
    user_id: str,
    endpoint: str,
    input_tokens: int,
    output_tokens: int,
    credits: int,
) -> None:
    session.add(
        UsageLog(
            user_id=user_id,
            endpoint=endpoint,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            credits=credits,
        )
    )
    session.commit()
