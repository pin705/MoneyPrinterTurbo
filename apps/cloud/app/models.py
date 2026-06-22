"""Database models for accounts + credit ledger.

The ledger is append-only: `CreditTransaction` rows are the source of truth,
`CreditBalance` is a fast cached running total guarded by a row lock on debit.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)  # subject from the auth provider (JWT sub)
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)


class CreditBalance(SQLModel, table=True):
    user_id: str = Field(primary_key=True, foreign_key="user.id")
    balance: int = 0  # whole credits; 1 credit ~= one AI content generation
    updated_at: datetime = Field(default_factory=_now)


class CreditTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    delta: int  # +N for top-up / signup grant, -N for usage
    reason: str  # "signup", "topup", "llm:script", "refund", ...
    ref: Optional[str] = Field(default=None, index=True)  # payment id / request id
    created_at: datetime = Field(default_factory=_now)


class UsageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    endpoint: str
    input_tokens: int = 0
    output_tokens: int = 0
    credits: int = 0
    created_at: datetime = Field(default_factory=_now)


class ProcessedPayment(SQLModel, table=True):
    """Idempotency guard so a payment webhook can't double-credit."""
    payment_id: str = Field(primary_key=True)
    user_id: str
    credits: int
    created_at: datetime = Field(default_factory=_now)
