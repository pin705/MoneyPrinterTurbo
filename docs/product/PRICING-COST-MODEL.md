# Pricing & Cost Model

> Locked decisions: **Hybrid** (Free + Pro/Business + credit packs) · **Local render**
> (infra cost ≈ 0) · **Vietnam first** (VND + SePay). See `WORKFLOW.md`.

The business model has exactly **one variable cost**: the AI text step (LLM script +
search terms). Rendering runs on the user's machine, so it costs us nothing. This doc
measures that one cost so prices can be set with a known margin.

## 1. Measured AI cost per video

Measured by reconstructing the **real** prompts from `app/services/llm.py` and pricing
them at DeepSeek `deepseek-chat` published rates (input miss $0.27 / hit $0.07 / output
$1.10 per 1M tokens), FX 1 USD = 24,000 VND. Reproduce with:

```bash
python scripts/estimate_llm_cost.py                 # offline estimate
DEEPSEEK_API_KEY=sk-... python scripts/estimate_llm_cost.py --live   # exact, real API
```

| Scenario | Calls | Cost / video | Cost / credit |
|---|---|---|---|
| Typical (3-paragraph short, script + terms) | 2 | **~18–24 VND** | ~9–12 VND |
| Worst case (10 paragraphs + social metadata) | 3 | ~94 VND | ~31 VND |

**Planning number: budget 50 VND/credit** — ~1.6× the worst case, absorbs retry storms
(up to 5 attempts), proxy overhead, and FX swings. Real typical cost is ~5× lower.

> ⚠️ Before locking public prices, run `--live` with a real key to replace the
> char-heuristic estimate with API-reported token counts.

## 2. Subscription tiers (starting point — A/B these)

1 credit ≈ 1 AI generation (script *or* terms). A typical video consumes ~2 credits.

| Tier | Price | Credits/mo | Key features | Batch |
|---|---|---|---|---|
| **Free** | 0đ | 30 on signup + 10/mo | Watermark · 720p · Pexels only · basic voices · 1 at a time | ✕ |
| **Creator** | 199.000đ/mo | 300 | No watermark · 1080p · all sources & voices · cloud library · priority | 5 |
| **Studio** | 499.000đ/mo | 1.000 | 4K · scheduled posting · API · multi-seat · analytics | 30 |

## 3. Credit packs (top-up, no subscription required)

| Pack | Price | Sell / credit | Our cost (@50đ) | Gross margin |
|---|---|---|---|---|
| 100 | 59.000đ | 590đ | 5.000đ | ~91% |
| 500 | 249.000đ | 498đ | 25.000đ | ~90% |
| 2.000 | 799.000đ | 400đ | 100.000đ | ~87% |

## 4. Worked margin — Creator @ 199.000đ

| Line | Amount |
|---|---|
| Revenue | 199.000đ |
| AI cost (300 credits × 50đ, budgeted) | −15.000đ |
| SePay fee (~2%) | −4.000đ |
| Infra amortized (Supabase/DB/host) | −5.000đ |
| Render cost | **0đ** |
| **Gross profit / user / month** | **~175.000đ (≈ 88%)** |

Unused credits ("breakage") push margin higher. The math holds because the expensive
part — rendering — lives on the user's machine.

## 5. Open items before launch

- [ ] Run `--live` cost measurement, lock the per-credit budget.
- [ ] Decide credit expiry policy (subscription credits roll over? packs expire?).
- [ ] Map SePay paid amount → credits / plan in `apps/cloud/app/payments.py`.
- [ ] Annual billing discount (e.g. 2 months free) to lift LTV and cash flow.
- [ ] VAT/e-invoice handling for VN customers.
