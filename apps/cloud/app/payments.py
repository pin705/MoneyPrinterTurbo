"""Payment webhook → credit top-up.

Idempotent: each provider payment id is recorded once, so retried/duplicate
webhooks can never double-credit. Wire `verify_signature` to your provider
(PayOS / VNPay / Stripe) before trusting the payload.
"""
import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from .credits import grant_credits
from .db import get_session
from .models import ProcessedPayment

router = APIRouter(prefix="/v1/payments", tags=["payments"])

WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "")

# Map a paid amount (minor units / VND) to credits. Tune to your pricing.
def amount_to_credits(amount: int, currency: str) -> int:
    # Example: 1 credit per 1,000 VND, or per $0.05 for USD cents.
    if currency.upper() == "VND":
        return amount // 1000
    return amount // 5  # USD cents


def verify_signature(raw: bytes, signature: str) -> bool:
    if not WEBHOOK_SECRET:
        return True  # dev mode — accept (DO NOT ship without a secret)
    expected = hmac.new(WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


@router.post("/webhook")
async def webhook(
    request: Request,
    session: Session = Depends(get_session),
    x_signature: str = "",
):
    raw = await request.body()
    if not verify_signature(raw, x_signature):
        raise HTTPException(401, "bad signature")

    payload = await request.json()
    payment_id = str(payload.get("payment_id") or payload.get("id") or "")
    user_id = str(payload.get("user_id") or "")
    amount = int(payload.get("amount") or 0)
    currency = str(payload.get("currency") or "VND")
    if not payment_id or not user_id:
        raise HTTPException(400, "missing payment_id/user_id")

    # Idempotency: bail if we've already processed this payment.
    if session.get(ProcessedPayment, payment_id):
        return {"status": "already_processed"}

    credits = amount_to_credits(amount, currency)
    session.add(
        ProcessedPayment(payment_id=payment_id, user_id=user_id, credits=credits)
    )
    session.commit()
    balance = grant_credits(
        session, user_id, credits, reason="topup", ref=f"pay:{payment_id}"
    )
    return {"status": "ok", "credits_added": credits, "balance": balance}
