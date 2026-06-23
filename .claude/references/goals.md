# Vidova — Goals & North Star

The "why / where we're going". Pair this with `architecture.md` (the "how") and
`.claude/rules/*` (the "do's"). Every agent should optimize toward these.

## Mission
Turn a topic into a **finished short video that's actually postable** (TikTok /
Reels / Shorts) — rendered **locally** on the user's machine. VN market first.

## Primary objective — best quality *per dollar*
Ship the **highest video quality at the lowest marginal cost** — not "max quality"
and not "cheapest" in isolation (those conflict), but the best quality-per-dollar:
1. **Quality bar is non-negotiable** — every output must clear "usable, not toy".
2. **Hit that bar the cheapest way**: local render (free) + free stock + Edge TTS by
   default; reach for paid AI only as **opt-in pass-through / BYO-key** when it's the
   *only* way to clear the bar.
3. Never trade the usable bar to save cost; never burn money chasing quality beyond
   what the user actually needs.

## Non-negotiables (don't violate without explicit sign-off)
1. **Orchestration, not a generator.** We don't compete on raw AI video gen
   (expensive, commodity). We orchestrate cheap/free sources + local render.
2. **Render stays local.** Never move rendering to our cloud (infra cost ≈ 0).
3. **Don't subsidize generation.** Expensive AI = pass-through or bring-your-own-key.
   The free path (stock + Edge TTS + local render) must always work.
4. **Video must be production-usable**, never a toy/slideshow. See the quality bar below.
5. **Vietnamese-first** (default VI, VND/SePay) · **monochrome design system**
   (black/white/zinc, no emerald — see `.claude/rules/design-system.md`).
6. **Moat = workflow + distribution + local-cost advantage**, not the gen models.

## Quality bar — "usable, not toy"  ★ current top priority
Videos currently feel "linh tinh" (random stock, ghép ngẫu nhiên). The fix is a
**scene-plan pipeline + quality gate** so every shot illustrates the line being
spoken. Full plan: `docs/VIDOVA_VIDEO_QUALITY.md`.
- Visuals chosen **per scene** (not global keywords); sequential, sentence-aligned (no random concat, no 3s loops).
- Dynamic captions / hook title / Ken Burns; **quality gate** blocks black-frame / silent / slideshow output before delivery.

## Roadmap (re-sequenced by money/risk — `docs/VIDOVA_MASTERPLAN.md`)
1. **Content Factory** — niche+audience → 30 *distinct* ideas → batch (built: `/plan`).
2. **E-commerce** — Shopify URL → ad/UGC scripts → render (clearest B2B money).
3. **Viral Clone** — URL → ASR → analyze → variants (de-risked: own/licensed input).
4. **Agent** — trend → auto-create → schedule-post (needs TikTok API approval).

## Detailed docs
- `docs/VIDOVA_MASTERPLAN.md` — product/tech strategy, credit economics.
- `docs/VIDOVA_VIDEO_QUALITY.md` — why videos look bad + the scene-plan fix.
