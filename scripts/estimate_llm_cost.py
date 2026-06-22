#!/usr/bin/env python3
"""Estimate the per-video AI (LLM) cost — the ONLY variable cost in the
local-render business model — so pricing tiers can be set with a known margin.

Two modes:
  * default (offline): reconstructs the REAL prompt templates from
    app/services/llm.py and estimates tokens by character heuristic. No API key,
    fully reproducible, gives a defensible planning number.
  * --live: actually calls DeepSeek (needs DEEPSEEK_API_KEY) and reads the exact
    token usage the API reports. Use this to replace the planning estimate with
    measured ground truth before locking prices.

Usage:
    python scripts/estimate_llm_cost.py
    python scripts/estimate_llm_cost.py --usd-vnd 24000 --paragraphs 3
    DEEPSEEK_API_KEY=sk-... python scripts/estimate_llm_cost.py --live
"""
from __future__ import annotations

import argparse
import os
import sys

# DeepSeek deepseek-chat published rates (USD per 1M tokens). These change —
# verify at https://api-docs.deepseek.com/quick_start/pricing and override here.
PRICE_INPUT_MISS = 0.27   # cache miss
PRICE_INPUT_HIT = 0.07    # cache hit (repeated system prompt)
PRICE_OUTPUT = 1.10

# The real system prompt shipped in app/services/llm.py (kept in sync manually).
SCRIPT_SYSTEM_PROMPT = """
# Role: Video Script Generator
## Goals:
Generate a script for a video, depending on the subject of the video.
## Constrains:
1. the script is to be returned as a string with the specified number of paragraphs.
2. do not under any circumstance reference this prompt in your response.
3. get straight to the point, don't start with unnecessary things like, "welcome to this video".
4. you must not include any type of markdown or formatting in the script, never use a title.
5. only return the raw content of the script.
6. do not include "voiceover", "narrator" or similar indicators of what should be spoken.
7. you must not mention the prompt, or anything about the script itself.
8. respond in the same language as the video subject.
""".strip()

TERMS_PROMPT_SKELETON = """
# Role: Video Search Terms Generator
## Goals:
Generate N search terms for stock videos, depending on the subject of a video.
## Constrains:
1. the search terms are to be returned as a json-array of strings.
2. each search term should consist of 1-3 words, always add the main subject of the video.
3. you must only return the json-array of strings.
4. the search terms must be related to the subject of the video.
5. reply with english search terms only.
## Output Example:
["search term 1", "search term 2", "search term 3","search term 4", "search term 5"]
## Context:
### Video Subject
### Video Script
""".strip()

SOCIAL_PROMPT_SKELETON = """
# Role: Short-Video Social Media Copywriter
## Goal
Write engaging publishing metadata for a short video posted on TikTok.
## Constraints
1. Respond ONLY with a single valid minified JSON object.
2. The JSON must contain exactly these keys: "title", "caption", "hashtags".
3. "title": a catchy hook, at most 100 characters.
4. "caption": an engaging description that ends with a call to action.
5. "hashtags": a JSON array of exactly 5 strings.
6. Use the same language as the video subject and script.
## Output Example
{"title":"...","caption":"...","hashtags":["#example","#video"]}
## Context
### Video Subject
### Video Script
""".strip()


def est_tokens(text: str, chars_per_token: float) -> int:
    return max(1, round(len(text) / chars_per_token))


def usd(input_tokens: int, output_tokens: int, cache_hit_input: int = 0) -> float:
    miss = max(0, input_tokens - cache_hit_input)
    return (
        miss / 1_000_000 * PRICE_INPUT_MISS
        + cache_hit_input / 1_000_000 * PRICE_INPUT_HIT
        + output_tokens / 1_000_000 * PRICE_OUTPUT
    )


def run_offline(paragraphs: int, usd_vnd: float, cpt: float, with_social: bool):
    # Representative generated lengths. ~110 words per script paragraph; a word
    # ~= 5 chars; so output chars ~= paragraphs * 110 * 6 (incl. spaces).
    script_out_chars = paragraphs * 110 * 6
    script = generated_script_placeholder(script_out_chars)

    # --- script call ---
    s_in = est_tokens(SCRIPT_SYSTEM_PROMPT + "\n\n# Initialization:\n- video subject: ...\n- number of paragraphs: 3\n- language: vi", cpt)
    s_out = est_tokens(script, cpt)

    # --- terms call (full script is in the prompt context) ---
    t_in = est_tokens(TERMS_PROMPT_SKELETON + script, cpt)
    t_out = est_tokens('["a b","c d","e f","g h","i j"]', cpt)

    calls = [("script", s_in, s_out), ("terms", t_in, t_out)]
    if with_social:
        so_in = est_tokens(SOCIAL_PROMPT_SKELETON + script, cpt)
        so_out = est_tokens('{"title":"' + "x" * 80 + '","caption":"' + "y" * 300 + '","hashtags":["#a","#b","#c","#d","#e"]}', cpt)
        calls.append(("social", so_in, so_out))

    print(f"\n  Scenario: {paragraphs} paragraph(s){' + social' if with_social else ''}, ~{cpt} chars/token")
    print(f"  {'call':<10}{'in_tok':>8}{'out_tok':>8}{'USD':>12}{'VND':>10}")
    total_usd = 0.0
    total_credits = len(calls)  # current model: 1 credit per LLM call
    for name, i, o in calls:
        # System prompt portion is cacheable on repeat generations.
        cache_hit = est_tokens(SCRIPT_SYSTEM_PROMPT, cpt) if name == "script" else 0
        c = usd(i, o, cache_hit)
        total_usd += c
        print(f"  {name:<10}{i:>8}{o:>8}{c:>12.6f}{c*usd_vnd:>10.1f}")
    print(f"  {'-'*48}")
    print(f"  {'TOTAL':<10}{'':>8}{'':>8}{total_usd:>12.6f}{total_usd*usd_vnd:>10.1f}  ({total_credits} credits)")
    per_credit_vnd = total_usd * usd_vnd / total_credits
    print(f"  => cost per VIDEO  ≈ {total_usd*usd_vnd:6.1f} VND   (${total_usd:.5f})")
    print(f"  => cost per CREDIT ≈ {per_credit_vnd:6.1f} VND")
    return total_usd * usd_vnd, total_credits


def generated_script_placeholder(n_chars: int) -> str:
    return "x" * n_chars


def run_live(paragraphs: int, usd_vnd: float):
    try:
        from openai import OpenAI
    except ImportError:
        sys.exit("openai package not installed. `uv sync` first, then re-run --live.")
    key = os.getenv("DEEPSEEK_API_KEY")
    if not key:
        sys.exit("Set DEEPSEEK_API_KEY to run --live.")
    client = OpenAI(api_key=key, base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))
    model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    subject = "5 thói quen buổi sáng giúp tăng năng suất"

    def call(prompt):
        r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}])
        u = r.usage
        return r.choices[0].message.content, u.prompt_tokens, u.completion_tokens

    print("\n  LIVE measurement against DeepSeek:")
    script_prompt = f"{SCRIPT_SYSTEM_PROMPT}\n\n# Initialization:\n- video subject: {subject}\n- number of paragraphs: {paragraphs}\n- language: vi"
    script, si, so = call(script_prompt)
    terms_prompt = TERMS_PROMPT_SKELETON + "\n" + subject + "\n" + script
    _, ti, to = call(terms_prompt)
    total = usd(si, so) + usd(ti, to)
    print(f"  script: in={si} out={so}")
    print(f"  terms:  in={ti} out={to}")
    print(f"  => per video ≈ {total*usd_vnd:.1f} VND (${total:.5f}), per credit ≈ {total*usd_vnd/2:.1f} VND")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--usd-vnd", type=float, default=24000.0)
    ap.add_argument("--paragraphs", type=int, default=3)
    ap.add_argument("--live", action="store_true")
    args = ap.parse_args()

    if args.live:
        run_live(args.paragraphs, args.usd_vnd)
        return

    print("=" * 64)
    print(" DeepSeek per-video AI cost — OFFLINE estimate (char heuristic)")
    print(f" Rates (USD/1M tok): in_miss={PRICE_INPUT_MISS} in_hit={PRICE_INPUT_HIT} out={PRICE_OUTPUT}")
    print(f" FX: 1 USD = {args.usd_vnd:,.0f} VND")
    print("=" * 64)
    # Vietnamese tokenizes denser than English; show a conservative (3.0) and a
    # typical (4.0) chars/token to bracket the real number.
    for cpt in (4.0, 3.0):
        run_offline(args.paragraphs, args.usd_vnd, cpt, with_social=False)
    print("\n  Worst-case (10 paragraphs + social, dense 3.0 cpt):")
    run_offline(10, args.usd_vnd, 3.0, with_social=True)
    print("\n  NOTE: replace with `--live` + a real key before locking prices.")


if __name__ == "__main__":
    main()
