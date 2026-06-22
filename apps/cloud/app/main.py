import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from . import plans, subscriptions
from .auth import current_user
from .credits import get_balance
from .db import get_session, init_db
from .llm_proxy import router as llm_router
from .models import User
from .payments import router as payments_router

app = FastAPI(title="MoneyPrinter Cloud", version="0.1.0")

origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/v1/me")
def me(
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    plan_id = subscriptions.effective_plan_id(session, user.id)
    return {
        "id": user.id,
        "email": user.email,
        "credits": get_balance(session, user.id),
        "plan_id": plan_id,
        "entitlements": plans.entitlements(plan_id),
        "subscription": subscriptions.subscription_summary(session, user.id),
    }


@app.get("/v1/plans")
def list_plans():
    """Public pricing catalog for the marketing/billing pages."""
    return {"plans": plans.plan_catalog(), "credit_packs": plans.credit_packs()}


app.include_router(llm_router)
app.include_router(payments_router)
