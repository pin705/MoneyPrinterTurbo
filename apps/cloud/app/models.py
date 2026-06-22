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


class Order(SQLModel, table=True):
    """A checkout intent fulfilled by a bank transfer (SePay).

    The user transfers `amount_vnd` with `code` in the memo; the SePay webhook
    matches the memo to this row, verifies the amount, and fulfills it (credits
    for a pack, or activating/extending a subscription for a plan). status is
    pending | paid | expired.
    """
    code: str = Field(primary_key=True)  # appears in the transfer memo
    user_id: str = Field(foreign_key="user.id", index=True)
    kind: str  # "plan" | "pack"
    target_id: str  # plan_id or pack_id
    billing_cycle: str = ""  # "monthly" | "yearly" for plans
    amount_vnd: int = 0
    credits: int = 0  # credits to grant (pack) or monthly grant (plan)
    status: str = "pending"
    sepay_ref: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)
    paid_at: Optional[datetime] = None


class Subscription(SQLModel, table=True):
    """A user's current plan. One row per user (absent row = Free tier).

    Created/renewed by the payment flow (Phase 2). status is one of
    active | past_due | canceled | expired. The plan a user is entitled to is
    resolved in subscriptions.py, which treats anything non-active (or expired
    by date) as Free.
    """
    user_id: str = Field(primary_key=True, foreign_key="user.id")
    plan_id: str  # "creator" | "studio"
    status: str = "active"
    billing_cycle: str = "monthly"  # "monthly" | "yearly"
    current_period_start: datetime = Field(default_factory=_now)
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    updated_at: datetime = Field(default_factory=_now)

