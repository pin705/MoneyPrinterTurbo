"""Managed LLM proxy — the monetization core.

The desktop app calls these instead of talking to DeepSeek directly, so the
DeepSeek key stays server-side and every call is metered against the user's
credits. Flow per request: debit → call DeepSeek → refund on failure.
"""
import os

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from .auth import current_user
from .credits import InsufficientCredits, debit_credits, grant_credits, log_usage
from .db import get_session
from .models import User
from .ratelimit import check_rate

# Per-user ceiling on AI calls/minute — caps credit burn from a runaway client.
LLM_RATE_LIMIT = int(os.getenv("LLM_RATE_LIMIT_PER_MIN", "30"))

router = APIRouter(prefix="/v1/llm", tags=["llm"])

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
CREDITS_PER_CALL = int(os.getenv("CREDITS_PER_CALL", "1"))


class ScriptIn(BaseModel):
    video_subject: str
    video_language: str = ""
    paragraph_number: int = 1


class TermsIn(BaseModel):
    video_subject: str
    video_script: str
    amount: int = 5


def _deepseek(messages: list[dict]) -> tuple[str, dict]:
    if not DEEPSEEK_API_KEY:
        raise HTTPException(503, "LLM proxy not configured")
    resp = httpx.post(
        f"{DEEPSEEK_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
        json={"model": DEEPSEEK_MODEL, "messages": messages, "temperature": 0.7},
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return text, usage


def _metered(session: Session, user: User, endpoint: str, messages: list[dict], ref):
    """Debit first, call DeepSeek, refund if the call fails."""
    check_rate(f"llm:{user.id}", limit=LLM_RATE_LIMIT, window=60)
    try:
        debit_credits(session, user.id, CREDITS_PER_CALL, f"llm:{endpoint}", ref)
    except InsufficientCredits:
        raise HTTPException(402, "insufficient credits")
    try:
        text, usage = _deepseek(messages)
    except Exception as e:
        grant_credits(session, user.id, CREDITS_PER_CALL, "refund", ref=f"refund:{ref}")
        raise HTTPException(502, f"LLM call failed: {e}")
    log_usage(
        session,
        user.id,
        endpoint,
        usage.get("prompt_tokens", 0),
        usage.get("completion_tokens", 0),
        CREDITS_PER_CALL,
    )
    return text


@router.post("/script")
def proxy_script(
    body: ScriptIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
    idempotency_key: str | None = Header(default=None),
):
    lang = f" Respond in {body.video_language}." if body.video_language else ""
    messages = [
        {
            "role": "user",
            "content": (
                f"Write a {body.paragraph_number}-paragraph spoken narration "
                f"for a short video about: {body.video_subject}.{lang} "
                "Return only the raw narration text — no markdown, no titles."
            ),
        }
    ]
    text = _metered(session, user, "script", messages, idempotency_key)
    return {"video_script": text.replace("\n", " ").strip()}


@router.post("/terms")
def proxy_terms(
    body: TermsIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
    idempotency_key: str | None = Header(default=None),
):
    messages = [
        {
            "role": "user",
            "content": (
                f"Generate {body.amount} English stock-footage search terms "
                f"(1-3 words each) for a video about '{body.video_subject}'. "
                f"Script: {body.video_script}. Return a JSON array of strings only."
            ),
        }
    ]
    text = _metered(session, user, "terms", messages, idempotency_key)
    return {"video_terms_raw": text}
