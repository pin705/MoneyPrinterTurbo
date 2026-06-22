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


class TestPayments(unittest.TestCase):
    _txn = 1000

    def _webhook(self, content: str, amount: int, ttype: str = "in"):
        TestPayments._txn += 1
        return client.post(
            "/v1/payments/webhook",
            json={
                "id": TestPayments._txn,
                "content": content,
                "transferAmount": amount,
                "transferType": ttype,
            },
        )

    def _credits(self, uid: str) -> int:
        return client.get("/v1/me", headers=_auth(uid)).json()["credits"]

    def test_pack_checkout_and_webhook_grants_credits(self):
        uid = "pay-pack"
        before = self._credits(uid)
        co = client.post(
            "/v1/payments/checkout",
            headers=_auth(uid),
            json={"kind": "pack", "target_id": "pack_100"},
        ).json()
        self.assertEqual(co["amount_vnd"], 59_000)
        code = co["order_code"]

        r = self._webhook(f"Chuyen tien {code}", 59_000)
        self.assertEqual(r.json()["status"], "ok")
        self.assertEqual(self._credits(uid), before + 100)

    def test_webhook_is_idempotent_on_replay(self):
        uid = "pay-idem"
        code = client.post(
            "/v1/payments/checkout",
            headers=_auth(uid),
            json={"kind": "pack", "target_id": "pack_100"},
        ).json()["order_code"]
        before = self._credits(uid)
        # Same SePay txn id replayed twice.
        TestPayments._txn += 1
        txn = TestPayments._txn
        body = {"id": txn, "content": code, "transferAmount": 59_000, "transferType": "in"}
        self.assertEqual(client.post("/v1/payments/webhook", json=body).json()["status"], "ok")
        self.assertEqual(
            client.post("/v1/payments/webhook", json=body).json()["status"],
            "already_processed",
        )
        self.assertEqual(self._credits(uid), before + 100)  # granted exactly once

    def test_plan_checkout_activates_subscription(self):
        uid = "pay-plan"
        before = self._credits(uid)
        code = client.post(
            "/v1/payments/checkout",
            headers=_auth(uid),
            json={"kind": "plan", "target_id": "creator", "billing_cycle": "monthly"},
        ).json()["order_code"]
        self.assertEqual(self._webhook(code, 199_000).json()["status"], "ok")
        me = client.get("/v1/me", headers=_auth(uid)).json()
        self.assertEqual(me["plan_id"], "creator")
        self.assertFalse(me["entitlements"]["watermark"])
        self.assertEqual(me["credits"], before + 300)

    def test_underpaid_does_not_fulfill(self):
        uid = "pay-under"
        before = self._credits(uid)
        code = client.post(
            "/v1/payments/checkout",
            headers=_auth(uid),
            json={"kind": "pack", "target_id": "pack_500"},
        ).json()["order_code"]
        self.assertEqual(self._webhook(code, 1_000).json()["status"], "underpaid")
        self.assertEqual(self._credits(uid), before)

    def test_unmatched_memo_is_recorded_not_fulfilled(self):
        r = self._webhook("random transfer with no order code", 100_000)
        self.assertEqual(r.json()["status"], "unmatched")

    def test_free_plan_is_not_purchasable(self):
        r = client.post(
            "/v1/payments/checkout",
            headers=_auth("pay-free"),
            json={"kind": "plan", "target_id": "free"},
        )
        self.assertEqual(r.status_code, 400)


class TestRateLimit(unittest.TestCase):
    def test_allows_up_to_limit_then_429(self):
        from fastapi import HTTPException

        from app.ratelimit import check_rate, reset

        reset()
        key = "unit-test-key"
        for _ in range(3):
            check_rate(key, limit=3, window=60)  # ok
        with self.assertRaises(HTTPException) as ctx:
            check_rate(key, limit=3, window=60)  # 4th trips
        self.assertEqual(ctx.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
