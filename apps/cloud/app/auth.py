import os

import jwt
from fastapi import Depends, Header, HTTPException
from sqlmodel import Session

from . import plans
from .credits import grant_credits
from .db import get_session
from .models import CreditBalance, User

# Supabase signs JWTs with HS256 + the project JWT secret. For Clerk/Auth0 swap
# this for RS256 + JWKS verification.
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
# Pin the algorithm to a known-good allowlist so JWT_ALG=none (or other
# alg-confusion values) can never disable signature verification.
_ALLOWED_ALGS = {"HS256", "RS256", "ES256"}
if JWT_ALG not in _ALLOWED_ALGS:
    raise RuntimeError(f"unsupported JWT_ALG {JWT_ALG!r}; allowed: {sorted(_ALLOWED_ALGS)}")
# Signup grant defaults to the Free plan's grant; env can override.
SIGNUP_GRANT = int(os.getenv("SIGNUP_CREDIT_GRANT", str(plans.PLANS[plans.FREE]["signup_grant"])))


def assert_production_ready() -> None:
    """Fail fast on insecure auth config; call at startup.

    Refuses to boot in production with the well-known default JWT secret, and
    logs a loud warning whenever dev auth (unsigned tokens) is enabled.
    """
    import sys

    if _is_dev_auth():
        print(
            "WARNING: AUTH_DEV_MODE is ON — unsigned dev:<uid> tokens are "
            "accepted. NEVER enable this in production.",
            file=sys.stderr,
        )
        return
    _PLACEHOLDERS = {"dev-secret-change-me", "your-supabase-jwt-secret", "changeme"}
    if not JWT_SECRET.strip() or JWT_SECRET in _PLACEHOLDERS:
        raise RuntimeError(
            "SUPABASE_JWT_SECRET is still a placeholder but AUTH_DEV_MODE is off. "
            "Set it to your real Supabase JWT secret (Supabase dashboard → "
            "Project Settings → API → JWT Secret) in apps/cloud/.env, or set "
            "AUTH_DEV_MODE=1 for local dev without Supabase. Refusing to start."
        )


def _is_dev_auth() -> bool:
    """Dev/test auth lets the local app and e2e run without a Supabase project.

    NEVER enable in production. Accepts tokens of the form ``dev:<uid>[:<email>]``
    so a mock front-end can sign in deterministically. Gated strictly behind the
    AUTH_DEV_MODE env flag.
    """
    return os.getenv("AUTH_DEV_MODE", "").lower() in ("1", "true", "yes")


def _claims_from_token(token: str) -> dict:
    if _is_dev_auth() and token.startswith("dev:"):
        parts = token.split(":", 2)
        uid = parts[1] if len(parts) > 1 else ""
        email = parts[2] if len(parts) > 2 else None
        if not uid:
            raise HTTPException(401, "dev token missing uid")
        return {"sub": uid, "email": email}
    try:
        return jwt.decode(
            token, JWT_SECRET, algorithms=[JWT_ALG], audience="authenticated"
        )
    except jwt.PyJWTError as e:
        raise HTTPException(401, f"invalid token: {e}")


def current_user(
    authorization: str = Header(default=""),
    session: Session = Depends(get_session),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.split(" ", 1)[1]
    claims = _claims_from_token(token)

    uid = claims.get("sub")
    if not uid:
        raise HTTPException(401, "token missing sub")

    user = session.get(User, uid)
    if user is None:
        # First login: create the account, balance row, and a signup grant.
        user = User(id=uid, email=claims.get("email"))
        session.add(user)
        session.add(CreditBalance(user_id=uid, balance=0))
        session.commit()
        grant_credits(session, uid, SIGNUP_GRANT, reason="signup", ref=f"signup:{uid}")
    return user
