# MoneyPrinter Studio — Production Workflow

From tool → finished product in users' hands. **Not an MVP.** This is the team
operating doc across **PO · PM · Dev · QA · User** roles. A rich visual version is
published as a Claude Artifact; this markdown is the version-controlled source of truth.

## Locked foundation decisions (2026-06-22)

| Decision | Choice | Why |
|---|---|---|
| Monetization | **Hybrid**: Free + Pro/Business subscription + credit packs | Highest revenue; batch = paid feature |
| Render location | **Local** (desktop, ffmpeg) — cloud only meters AI | Infra cost ≈ 0 → high margin |
| Market | **Vietnam first** — VND + **SePay** | Matches SePay + existing `vi` i18n |

## 0. GOAT — the core that must never break (`app/`)

The render pipeline: **LLM script/terms → stock footage (Pexels/Pixabay/Coverr) →
Edge TTS voiceover → subtitles → ffmpeg/moviepy compose**, plus auto-post
(`upload_post.py`). Every change must preserve this contract. Architecture leaves room
for future sources (YouTube/Storyblocks/AI-gen) and voices (ElevenLabs) via the
`material.py` provider pattern.

## Current state (audited)

| Area | Status | Notes |
|---|---|---|
| Render backend `app/` | ✅ have | FastAPI pipeline; task state in memory/Redis (no durable DB, no real queue) |
| Cloud monetization `apps/cloud/` | 🟡 partial | Auth + credit ledger + LLM proxy + idempotent webhook exist; SePay/plans/checkout absent |
| Web `apps/web/` | 🟡 partial | React19+Vite+Tailwind4+shadcn; only 2 views, zustand nav; no router/auth/billing |
| Desktop `apps/desktop/` | 🟡 partial | Tauri v2, updater + Python sidecar; pubkey placeholder, no tray/notify/signing |
| Landing `apps/landing/` | 🟡 partial | 1 Astro file; no real pricing/legal/SEO |
| Admin / Ops | 🔴 none | No admin, analytics, error tracking, status page, signed installers, backup |

## Roles & ceremonies

| Role | Owns | Output |
|---|---|---|
| **PO** | Value, priority, acceptance criteria, pricing | User story + acceptance criteria |
| **PM** | Phasing, dependencies, risk, DoR/DoD | Roadmap + task list |
| **Dev** | Technical design, code, migrations, docs | PR + tests + docs |
| **QA** | Test cases, e2e, regression, payment/security testing | Test report + bug log |
| **User** | Plays a real user end-to-end (UAT) | UAT pass/fail + UX feedback |

**Each phase closes with a User-run UAT**: clean install → sign up → buy a plan via
SePay (sandbox) → run a batch of 5 videos → publish → verify the invoice. Pass = ship.

### One-item pipeline

```
PO story → PM checks Definition of Ready → Dev technical design
   → Dev code + unit tests → QA writes & runs tests → User UAT end-to-end
   → PM checks Definition of Done → Release
```

- **Definition of Ready:** story has acceptance criteria · UI designed (card/box) ·
  dependencies clear · estimated.
- **Definition of Done:** code + tests pass · QA regression green · UAT pass · i18n
  vi/en · docs + changelog · no security/payment defects · deployable.

## UI/UX standard ("xịn, dễ dùng")

- **Choices = cards/boxes, not dropdowns.** Aspect, voice, source, plan, transition
  render as cards with icon/preview/description + clear selected state. Reusable
  `CardSelect` / `RadioCardGroup` replaces `OptSelect`/`select`.
- Unified design system (tokens, dark+light, loading/empty/error states everywhere).
- Preview-driven choices (hear the voice, see the subtitle style, preview the ratio).
- Progressive disclosure (simple by default, "Advanced" reveals more).
- Instant feedback (toasts, % render progress, completion notifications).
- Every screen answers: *Where am I? What do I do next? What if it errors/waits?*

## Roadmap — 6 phases

| Phase | Goal | Headline deliverables |
|---|---|---|
| **0 · Foundation** (~1wk) | Solid ground before features | Real router · durable DB for tasks · `CardSelect` + tokens · CI (FE+BE) |
| **1 · Auth + Accounts + Credit** (~1.5wk) | Login, see credit, AI debits real credit | Auth UI + OAuth + desktop deep-link · credit dashboard · measure real DeepSeek cost |
| **2 · SePay + Plans** (~2wk) ⭐revenue | Users can pay | Real SePay (QR/link + signed webhook) · subscription engine · invoices · pricing cards |
| **3 · Batch & video mgmt** (~2wk) ⭐differentiator | Mass production as a paid feature | Local render queue (retry/pause/resume) · CSV/topic-list → N videos · library · templates · scheduling |
| **4 · Desktop + Landing + Hardening** (~2wk) | Ship a real, trustworthy product | Signed auto-update · tray/notify · ffmpeg onboarding · signed installers · full landing + legal + SEO · emails · help center |
| **5 · Launch & Ops** (~1wk + ongoing) | Controlled launch + scale base | Admin panel · analytics/MRR · Sentry · status page · backup/DR · expansion backlog |

Detailed tasks per phase: see `TASK-BREAKDOWN.md`. Cost/pricing math: `PRICING-COST-MODEL.md`.

## Non-functional requirements & security

- **Money & data:** append-only ledger, periodic reconciliation, daily backups + PITR;
  all plan/credit enforcement server-side; webhook idempotency + SePay signature.
- **Performance/stability:** batch runs in background without freezing UI; auto-retry;
  resume after crash; API p95 < 500ms (excl. local render); sidecar health + auto-restart.
- **Security:** secrets server-side; rate limit; anti brute-force & free-tier abuse;
  pinned deps + vuln scan; CSP for web; signed installers.
- **Quality:** unit + e2e (Playwright) + render smoke; CI must be green to merge; full
  vi/en i18n; basic a11y; VND/VN date formatting.

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| AI cost higher than modeled | Thin margin | Measured ~9–31đ/credit; budget 50đ; cache prompts; `--live` check before locking |
| Forged/duplicate SePay webhook | Money loss | Signature verify + idempotency (foundation exists) + reconciliation |
| Local render fails (weak machine / no ffmpeg) | Churn, support load | ffmpeg onboarding, resource checks, clear errors |
| Footage/music copyright | Legal | Royalty-free sources only + disclaimer + ToS |
| Free-tier abuse (fake signups) | Burned grants | Email verify, rate limit, smaller grant, fraud guard |
| Breaking the GOAT on refactor | Lose core product | CI render smoke; never change render API contract |
