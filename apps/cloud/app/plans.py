"""Plan catalog + entitlements — the single source of truth for pricing.

Consumed by:
  * entitlements resolution (what a user's plan unlocks) — subscriptions.py
  * the SePay amount→plan/credit mapping — payments.py (Phase 2)
  * the web pricing page (GET /v1/plans)

All prices are VND. Numbers come from docs/product/PRICING-COST-MODEL.md and are
starting points to A/B — change them here and every surface follows.
"""
from __future__ import annotations

FREE = "free"
CREATOR = "creator"
STUDIO = "studio"

# Resolution tiers, ordered so callers can compare with the index.
RESOLUTIONS = ["720p", "1080p", "4k"]

PLANS: dict[str, dict] = {
    FREE: {
        "id": FREE,
        "name": "Free",
        "price_vnd_month": 0,
        "price_vnd_year": 0,
        "monthly_credits": 10,
        "signup_grant": 30,
        "entitlements": {
            "watermark": True,
            "max_resolution": "720p",
            "max_batch": 1,
            "sources": ["pexels"],
            "voices": "basic",
            "scheduling": False,
            "api": False,
            "cloud_library": False,
        },
    },
    CREATOR: {
        "id": CREATOR,
        "name": "Creator",
        "price_vnd_month": 199_000,
        # ~2 months free on annual.
        "price_vnd_year": 1_990_000,
        "monthly_credits": 300,
        "signup_grant": 0,
        "entitlements": {
            "watermark": False,
            "max_resolution": "1080p",
            "max_batch": 5,
            "sources": ["pexels", "pixabay", "coverr"],
            "voices": "all",
            "scheduling": False,
            "api": False,
            "cloud_library": True,
        },
    },
    STUDIO: {
        "id": STUDIO,
        "name": "Studio",
        "price_vnd_month": 499_000,
        "price_vnd_year": 4_990_000,
        "monthly_credits": 1_000,
        "signup_grant": 0,
        "entitlements": {
            "watermark": False,
            "max_resolution": "4k",
            "max_batch": 30,
            "sources": ["pexels", "pixabay", "coverr"],
            "voices": "all",
            "scheduling": True,
            "api": True,
            "cloud_library": True,
        },
    },
}

# One-off credit top-ups (no subscription required). VND.
CREDIT_PACKS: list[dict] = [
    {"id": "pack_100", "credits": 100, "price_vnd": 59_000},
    {"id": "pack_500", "credits": 500, "price_vnd": 249_000},
    {"id": "pack_2000", "credits": 2_000, "price_vnd": 799_000},
]


def get_plan(plan_id: str | None) -> dict:
    """Return a plan dict, defaulting to Free for unknown/missing ids."""
    return PLANS.get(plan_id or FREE, PLANS[FREE])


def entitlements(plan_id: str | None) -> dict:
    return get_plan(plan_id)["entitlements"]


def plan_catalog() -> list[dict]:
    """Ordered list for the pricing page."""
    return [PLANS[FREE], PLANS[CREATOR], PLANS[STUDIO]]


def credit_packs() -> list[dict]:
    return list(CREDIT_PACKS)


def resolution_allowed(plan_id: str | None, resolution: str) -> bool:
    """True if `resolution` is within the plan's max tier."""
    ent = entitlements(plan_id)
    try:
        return RESOLUTIONS.index(resolution) <= RESOLUTIONS.index(
            ent["max_resolution"]
        )
    except ValueError:
        return False
