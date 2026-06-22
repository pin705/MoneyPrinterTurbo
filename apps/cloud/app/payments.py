"""SePay checkout + webhook → credit top-up / subscription activation.

Flow (bank-transfer via SePay):
  1. POST /v1/payments/checkout (auth) creates an Order with a unique `code`,
     returns the amount + a VietQR image URL whose memo embeds that code.
  2. The user scans/pays; the bank credits the merchant account.
  3. SePay calls POST /v1/payments/webhook with the transaction. We authenticate
     it (Apikey), find the Order by the code in the memo, verify the amount, and
     fulfill it. Idempotent on the SePay transaction id AND on the grant ref, so a
     replayed webhook can never double-credit.

Set SEPAY_WEBHOOK_API_KEY in production; SEPAY_ACCOUNT/SEPAY_BANK build the QR.
"""
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from . import plans
from .auth import current_user
from .credits import grant_credits
from .db import get_session
from .models import Order, ProcessedPayment, Subscription, User

router = APIRouter(prefix="/v1/payments", tags=["payments"])

WEBHOOK_API_KEY = os.getenv("SEPAY_WEBHOOK_API_KEY", "")
SEPAY_ACCOUNT = os.getenv("SEPAY_ACCOUNT", "")
SEPAY_BANK = os.getenv("SEPAY_BANK", "")  # e.g. "VPBank", "MBBank"
ORDER_TTL_MINUTES = int(os.getenv("ORDER_TTL_MINUTES", "60"))


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_code() -> str:
    # Short, memo-friendly, unambiguous in a bank transfer content field.
    return "MPT" + secrets.token_hex(4).upper()


def _qr_url(code: str, amount: int) -> str:
    if not (SEPAY_ACCOUNT and SEPAY_BANK):
        return ""
    return (
        "https://qr.sepay.vn/img"
        f"?acc={quote(SEPAY_ACCOUNT)}&bank={quote(SEPAY_BANK)}"
        f"&amount={amount}&des={quote(code)}"
    )


class CheckoutIn(BaseModel):
    kind: str  # "plan" | "pack"
    target_id: str  # plan id ("creator"/"studio") or pack id ("pack_100"…)
    billing_cycle: str = "monthly"  # for plans: "monthly" | "yearly"


def _price_order(body: CheckoutIn) -> tuple[int, int]:
    """Return (amount_vnd, credits) for a checkout, or raise 400."""
    if body.kind == "pack":
        pack = next((p for p in plans.CREDIT_PACKS if p["id"] == body.target_id), None)
        if not pack:
            raise HTTPException(400, "unknown credit pack")
        return pack["price_vnd"], pack["credits"]
    if body.kind == "plan":
        plan = plans.PLANS.get(body.target_id)
        if not plan or plan["id"] == plans.FREE:
            raise HTTPException(400, "unknown or non-purchasable plan")
        if body.billing_cycle == "yearly":
            return plan["price_vnd_year"], plan["monthly_credits"]
        return plan["price_vnd_month"], plan["monthly_credits"]
    raise HTTPException(400, "kind must be 'plan' or 'pack'")


@router.post("/checkout")
def checkout(
    body: CheckoutIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    amount, credits = _price_order(body)
    code = _new_code()
    order = Order(
        code=code,
        user_id=user.id,
        kind=body.kind,
        target_id=body.target_id,
        billing_cycle=body.billing_cycle if body.kind == "plan" else "",
        amount_vnd=amount,
        credits=credits,
        status="pending",
    )
    session.add(order)
    session.commit()
    return {
        "order_code": code,
        "amount_vnd": amount,
        "transfer_content": code,
        "qr_url": _qr_url(code, amount),
        "account": SEPAY_ACCOUNT,
        "bank": SEPAY_BANK,
        "expires_in_minutes": ORDER_TTL_MINUTES,
    }


@router.get("/orders/{code}")
def get_order(
    code: str,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    """Poll an order's status (the web shows the QR and waits for 'paid')."""
    order = session.get(Order, code)
    if not order or order.user_id != user.id:
        raise HTTPException(404, "order not found")
    return {"order_code": order.code, "status": order.status, "amount_vnd": order.amount_vnd}


@router.get("/invoices")
def list_invoices(
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Order).where(Order.user_id == user.id, Order.status == "paid")
    ).all()
    rows.sort(key=lambda o: o.paid_at or o.created_at, reverse=True)
    return {
        "invoices": [
            {
                "order_code": o.code,
                "kind": o.kind,
                "target_id": o.target_id,
                "amount_vnd": o.amount_vnd,
                "credits": o.credits,
                "paid_at": (o.paid_at.isoformat() if o.paid_at else None),
            }
            for o in rows
        ]
    }


def _verify_webhook(authorization: str) -> bool:
    if not WEBHOOK_API_KEY:
        return True  # dev mode — accept (DO NOT ship without the key set)
    # SePay sends: Authorization: Apikey <key>
    expected = f"Apikey {WEBHOOK_API_KEY}"
    return secrets.compare_digest(authorization or "", expected)


def _fulfill(session: Session, order: Order) -> None:
    """Grant what the order bought. grant_credits is idempotent on `ref`."""
    ref = f"order:{order.code}"
    if order.kind == "pack":
        grant_credits(session, order.user_id, order.credits, "topup", ref=ref)
    else:  # plan
        days = 365 if order.billing_cycle == "yearly" else 30
        sub = session.get(Subscription, order.user_id)
        now = _now()
        # Extend from the later of now / current period end (renewal stacks).
        base = now
        if sub and sub.current_period_end:
            end = sub.current_period_end
            end = end if end.tzinfo else end.replace(tzinfo=timezone.utc)
            if end > now and sub.plan_id == order.target_id:
                base = end
        new_end = base + timedelta(days=days)
        if sub is None:
            sub = Subscription(user_id=order.user_id)
            session.add(sub)
        sub.plan_id = order.target_id
        sub.status = "active"
        sub.billing_cycle = order.billing_cycle or "monthly"
        sub.current_period_start = now
        sub.current_period_end = new_end
        sub.cancel_at_period_end = False
        sub.updated_at = now
        session.commit()
        grant_credits(session, order.user_id, order.credits, "subscription", ref=ref)
    order.status = "paid"
    order.paid_at = _now()
    session.add(order)
    session.commit()


@router.post("/webhook")
async def webhook(
    request: Request,
    session: Session = Depends(get_session),
    authorization: str = Header(default=""),
):
    if not _verify_webhook(authorization):
        raise HTTPException(401, "bad webhook auth")

    payload = await request.json()
    sepay_id = str(payload.get("id") or payload.get("referenceCode") or "")
    content = str(payload.get("content") or "")
    amount = int(payload.get("transferAmount") or 0)
    transfer_type = str(payload.get("transferType") or "in")
    if not sepay_id:
        raise HTTPException(400, "missing transaction id")
    if transfer_type != "in":
        return {"status": "ignored", "reason": "not an incoming transfer"}

    # Idempotency: a replayed transaction is a no-op.
    if session.get(ProcessedPayment, sepay_id):
        return {"status": "already_processed"}

    # Match the order code embedded in the transfer memo.
    upper = content.upper()
    order = next(
        (
            o
            for o in session.exec(select(Order).where(Order.status == "pending")).all()
            if o.code.upper() in upper
        ),
        None,
    )
    if order is None:
        # Record so we don't reprocess; flag for manual reconciliation.
        session.add(ProcessedPayment(payment_id=sepay_id, user_id="", credits=0))
        session.commit()
        return {"status": "unmatched", "reason": "no pending order in memo"}

    if amount < order.amount_vnd:
        return {"status": "underpaid", "expected": order.amount_vnd, "got": amount}

    session.add(
        ProcessedPayment(payment_id=sepay_id, user_id=order.user_id, credits=order.credits)
    )
    order.sepay_ref = sepay_id
    _fulfill(session, order)
    return {"status": "ok", "order_code": order.code, "fulfilled": order.kind}
