"""Lightweight in-process rate limiter (sliding window).

Guards money-touching endpoints against abuse (credit burn, checkout spam). This
is per-process — fine for a single instance. For multiple instances move the
counter to Redis (same interface). Keys are caller-scoped (user id), so one
abuser can't starve everyone.
"""
import threading
import time
from collections import defaultdict

from fastapi import HTTPException

_hits: dict[str, list[float]] = defaultdict(list)
_lock = threading.Lock()


def check_rate(key: str, limit: int, window: float) -> None:
    """Allow at most `limit` calls per `window` seconds for `key`; else 429."""
    now = time.monotonic()
    cutoff = now - window
    with _lock:
        recent = [t for t in _hits.get(key, ()) if t > cutoff]
        if len(recent) >= limit:
            # Keep the (non-empty) window so the limit stays enforced.
            _hits[key] = recent
            raise HTTPException(429, "rate limit exceeded, slow down")
        recent.append(now)
        _hits[key] = recent  # never leaves an empty list to leak


def reset() -> None:
    """Test helper — clear all counters."""
    with _lock:
        _hits.clear()
