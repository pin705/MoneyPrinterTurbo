"""Phase 4 — research grounding (free, no API key).

Pulls a few factual sentences from Wikipedia (vi/en) so the LLM writes a script
grounded in real facts instead of generic/hallucinated filler. Uses the free
Wikipedia action API (no key); falls back gracefully to "" on any error, so it
can never block or fail a render.

DuckDuckGo (lib `ddgs`) is used as an optional broader source if installed.
"""

import httpx
from loguru import logger

_UA = "VidovaResearch/1.0 (+https://moneyprinter.studio)"
_TIMEOUT = 8.0


def _wikipedia(lang: str, subject: str, max_chars: int) -> str:
    base = f"https://{lang}.wikipedia.org/w/api.php"
    with httpx.Client(timeout=_TIMEOUT, headers={"User-Agent": _UA}) as c:
        r = c.get(
            base,
            params={
                "action": "query",
                "list": "search",
                "srsearch": subject,
                "srlimit": 3,
                "format": "json",
            },
        )
        hits = r.json().get("query", {}).get("search", [])
        titles = [h["title"] for h in hits[:2]]
        facts = []
        for title in titles:
            r2 = c.get(
                base,
                params={
                    "action": "query",
                    "prop": "extracts",
                    "exintro": 1,
                    "explaintext": 1,
                    "redirects": 1,
                    "titles": title,
                    "format": "json",
                },
            )
            for page in r2.json().get("query", {}).get("pages", {}).values():
                extract = (page.get("extract") or "").strip()
                if extract:
                    facts.append(extract)
    return "\n".join(facts).strip()[:max_chars]


def _duckduckgo(subject: str, max_chars: int) -> str:
    """Optional: only runs if the `ddgs` package is installed."""
    try:
        from ddgs import DDGS  # type: ignore
    except Exception:
        return ""
    try:
        with DDGS() as d:
            snippets = [
                r.get("body", "") for r in d.text(subject, max_results=4) if r.get("body")
            ]
        return "\n".join(snippets).strip()[:max_chars]
    except Exception as e:
        logger.warning(f"research ddg failed: {e}")
        return ""


def gather_facts(subject: str, language: str = "", max_chars: int = 1200) -> str:
    """Return a short block of reference facts for the subject, or "" if none."""
    subject = (subject or "").strip()
    if not subject:
        return ""
    lang = "vi" if (language or "").lower().startswith("vi") else "en"
    langs = [lang] if lang == "en" else [lang, "en"]  # try VI then EN
    for l in langs:
        try:
            text = _wikipedia(l, subject, max_chars)
            if text:
                logger.info(f"research: {len(text)} chars from {l}.wikipedia")
                return text
        except Exception as e:
            logger.warning(f"research {l}.wikipedia failed: {e}")

    ddg = _duckduckgo(subject, max_chars)
    if ddg:
        logger.info(f"research: {len(ddg)} chars from duckduckgo")
    return ddg
