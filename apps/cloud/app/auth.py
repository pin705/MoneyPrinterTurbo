import os

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient
from sqlmodel import Session

from . import plans
from .credits import grant_credits
from .db import get_session
from .models import CreditBalance, User

# Supabase verifies access tokens two ways depending on the project:
#   • Modern projects use ASYMMETRIC signing (ES256/RS256). Tokens are verified
#     against the project's public JWKS — set SUPABASE_URL and we fetch
#     {SUPABASE_URL}/auth/v1/.well-known/jwks.json. This is the default path.
#   • Legacy projects use a SYMMETRIC HS256 shared secret (SUPABASE_JWT_SECRET).
# For Clerk/Auth0, point SUPABASE_URL-style JWKS at their issuer instead.
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
# Default to ES256 (modern Supabase); HS256 only matters for the legacy path.
JWT_ALG = os.getenv("JWT_ALG", "ES256")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "authenticated")
# Pin algorithms to a known-good allowlist so JWT_ALG=none (or other
# alg-confusion values) can never disable signature verification.
_ALLOWED_ALGS = {"HS256", "RS256", "ES256"}
if JWT_ALG not in _ALLOWED_ALGS:
    raise RuntimeError(f"unsupported JWT_ALG {JWT_ALG!r}; allowed: {sorted(_ALLOWED_ALGS)}")
_ASYMMETRIC_ALGS = ["ES256", "RS256"]
# Signup grant defaults to the Free plan's grant; env can override.
SIGNUP_GRANT = int(os.getenv("SIGNUP_CREDIT_GRANT", str(plans.PLANS[plans.FREE]["signup_grant"])))

# Lazily-built JWKS client; cached across requests (caches the key set itself).
_jwks_client: PyJWKClient | None = None


def _use_jwks() -> bool:
    """Asymmetric verification when a Supabase URL (JWKS source) is configured."""
    return bool(SUPABASE_URL)


def _jwks() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        # cache_jwk_set keeps the fetched keys for `lifespan` seconds so we don't
        # hit the network on every request.
        _jwks_client = PyJWKClient(url, cache_jwk_set=True, lifespan=600)
    return _jwks_client


def _looks_like_api_key(secret: str) -> bool:
    """New-style Supabase API keys (sb_secret_…/sb_publishable_…) are NOT the
    JWT signing secret — a common misconfiguration."""
    return secret.startswith(("sb_secret_", "sb_publishable_"))


def assert_production_ready() -> None:
    """Fail fast on insecure / misconfigured auth; call at startup."""
    import sys

    if _is_dev_auth():
        print(
            "WARNING: AUTH_DEV_MODE is ON — unsigned dev:<uid> tokens are "
            "accepted. NEVER enable this in production.",
            file=sys.stderr,
        )
        return
    if _use_jwks():
        # Asymmetric path: keys come from JWKS; no shared secret needed. Warn if
        # someone pasted an API key into SUPABASE_JWT_SECRET expecting it to work.
        if JWT_SECRET and _looks_like_api_key(JWT_SECRET):
            print(
                "NOTE: SUPABASE_JWT_SECRET looks like an API key and is ignored — "
                "asymmetric (JWKS) verification via SUPABASE_URL is in use.",
                file=sys.stderr,
            )
        return
    _PLACEHOLDERS = {"dev-secret-change-me", "your-supabase-jwt-secret", "changeme"}
    if not JWT_SECRET.strip() or JWT_SECRET in _PLACEHOLDERS or _looks_like_api_key(JWT_SECRET):
        raise RuntimeError(
            "Auth is not configured. Either set SUPABASE_URL (e.g. "
            "https://<ref>.supabase.co) so tokens are verified via JWKS — this is "
            "what modern Supabase projects need — or, for a legacy project, set "
            "SUPABASE_JWT_SECRET to the real HS256 JWT secret (Dashboard → Project "
            "Settings → API → JWT Settings → JWT Secret). Note: sb_secret_…/"
            "sb_publishable_… are API keys, NOT the JWT secret. Or set "
            "AUTH_DEV_MODE=1 for local dev. Refusing to start."
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
        if _use_jwks():
            signing_key = _jwks().get_signing_key_from_jwt(token).key
            return jwt.decode(
                token,
                signing_key,
                algorithms=_ASYMMETRIC_ALGS,
                audience=JWT_AUDIENCE,
                issuer=f"{SUPABASE_URL}/auth/v1",
            )
        return jwt.decode(
            token, JWT_SECRET, algorithms=["HS256"], audience=JWT_AUDIENCE
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
