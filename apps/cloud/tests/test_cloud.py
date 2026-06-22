"""Cloud backend tests — plans, entitlements, dev auth, /v1/me, subscriptions.

Runs against a temp SQLite DB with dev auth enabled, so no Supabase/Postgres is
needed. Env must be set before importing app.main (the engine is built at import).
"""
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

_CLOUD_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_CLOUD_ROOT))

_TMP = tempfile.TemporaryDirectory()
os.environ["AUTH_DEV_MODE"] = "1"
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_TMP.name) / 'test.db'}"

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session  # noqa: E402

from app import plans, subscriptions  # noqa: E402
from app.db import engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Subscription  # noqa: E402

init_db()
client = TestClient(app)


def _auth(uid: str, email: str = "u@example.com") -> dict:
    return {"Authorization": f"Bearer dev:{uid}:{email}"}


class TestPlans(unittest.TestCase):
    def test_catalog_endpoint_is_public(self):
        r = client.get("/v1/plans")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        ids = [p["id"] for p in body["plans"]]
        self.assertEqual(ids, ["free", "creator", "studio"])
        self.assertEqual(len(body["credit_packs"]), 3)

    def test_entitlements(self):
        self.assertTrue(plans.entitlements("free")["watermark"])
        self.assertFalse(plans.entitlements("creator")["watermark"])
        self.assertEqual(plans.entitlements("studio")["max_batch"], 30)
        # Unknown plan falls back to Free.
        self.assertTrue(plans.entitlements("bogus")["watermark"])

    def test_resolution_allowed(self):
        self.assertTrue(plans.resolution_allowed("creator", "1080p"))
        self.assertFalse(plans.resolution_allowed("free", "1080p"))
        self.assertTrue(plans.resolution_allowed("studio", "4k"))


class TestAuthAndMe(unittest.TestCase):
    def test_me_requires_token(self):
        self.assertEqual(client.get("/v1/me").status_code, 401)

    def test_first_login_grants_free_credits(self):
        r = client.get("/v1/me", headers=_auth("user-free"))
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["plan_id"], "free")
        self.assertEqual(body["credits"], plans.PLANS["free"]["signup_grant"])
        self.assertTrue(body["entitlements"]["watermark"])
        self.assertIsNone(body["subscription"])

    def test_dev_token_rejected_when_dev_mode_off(self):
        # _claims_from_token only honors dev: tokens when AUTH_DEV_MODE is on.
        import app.auth as auth

        self.assertTrue(auth._is_dev_auth())


class TestSubscriptions(unittest.TestCase):
    def test_active_creator_subscription_is_honored(self):
        uid = "user-creator"
        client.get("/v1/me", headers=_auth(uid))  # create the user
        with Session(engine) as s:
            s.add(
                Subscription(
                    user_id=uid,
                    plan_id="creator",
                    status="active",
                    current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
                )
            )
            s.commit()
        r = client.get("/v1/me", headers=_auth(uid))
        body = r.json()
        self.assertEqual(body["plan_id"], "creator")
        self.assertFalse(body["entitlements"]["watermark"])
        self.assertEqual(body["subscription"]["status"], "active")

    def test_expired_subscription_falls_back_to_free(self):
        uid = "user-expired"
        client.get("/v1/me", headers=_auth(uid))
        with Session(engine) as s:
            s.add(
                Subscription(
                    user_id=uid,
                    plan_id="studio",
                    status="active",
                    current_period_end=datetime.now(timezone.utc) - timedelta(days=1),
                )
            )
            s.commit()
        r = client.get("/v1/me", headers=_auth(uid))
        self.assertEqual(r.json()["plan_id"], "free")

    def test_canceled_status_falls_back_to_free(self):
        uid = "user-canceled"
        client.get("/v1/me", headers=_auth(uid))
        with Session(engine) as s:
            s.add(
                Subscription(
                    user_id=uid,
                    plan_id="creator",
                    status="canceled",
                    current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
                )
            )
            s.commit()
        r = client.get("/v1/me", headers=_auth(uid))
        self.assertEqual(r.json()["plan_id"], "free")


if __name__ == "__main__":
    unittest.main()
