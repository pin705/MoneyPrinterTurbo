import os

import jwt
from fastapi import Depends, Header, HTTPException
from sqlmodel import Session

from .credits import grant_credits
from .db import get_session
from .models import CreditBalance, User

# Supabase signs JWTs with HS256 + the project JWT secret. For Clerk/Auth0 swap
# this for RS256 + JWKS verification.
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
SIGNUP_GRANT = int(os.getenv("SIGNUP_CREDIT_GRANT", "20"))


def current_user(
    authorization: str = Header(default=""),
    session: Session = Depends(get_session),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        claims = jwt.decode(
            token, JWT_SECRET, algorithms=[JWT_ALG], audience="authenticated"
        )
    except jwt.PyJWTError as e:
        raise HTTPException(401, f"invalid token: {e}")

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
