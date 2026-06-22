# Task Breakdown

Detailed, checkable tasks per phase. Tags: `[DEV] [QA] [PO] [PM]`. Each phase ends with a
**User UAT** gate. See `WORKFLOW.md` for context and `PRICING-COST-MODEL.md` for numbers.

---

## Phase 0 — Foundation (~1 week)

**Goal:** make the ground solid before adding features. No new user-facing features.

- [ ] `[DEV]` Replace zustand 2-view nav (`store/nav.ts`) with a real router
      (react-router-dom): routes `/create`, `/library`, + stubs `/dashboard`,
      `/billing`, `/settings`, `/login`. Auth-guard shell (no-op for now).
- [ ] `[DEV]` Build reusable `CardSelect` / `RadioCardGroup` (card/box selector with
      icon, description, selected state) — the foundation of the UI/UX standard.
- [ ] `[DEV]` Migrate one existing dropdown (e.g. video source / aspect) to `CardSelect`
      as a reference implementation.
- [ ] `[DEV]` Durable DB for render tasks in `app/` (SQLite via SQLModel) replacing
      memory state; keep Redis option; write a migration + backfill.
- [ ] `[DEV]` Design tokens pass on `index.css` (color/space/radius, dark+light).
- [ ] `[DEV]` Extend CI: add a frontend job (pnpm install + typecheck + lint) beside the
      Python job; keep Python render smoke.
- [ ] `[QA]` Playwright e2e scaffold + a smoke test for the render pipeline.

**DoD:** web has multiple routes; render tasks persist across restart; CI green incl. a
frontend job; at least one card-select live in the wizard.

---

## Phase 1 — Auth + Accounts + Credit (~1.5 weeks)

**Goal:** users log in, see their credit balance, and AI calls debit real credits.

- [ ] `[DEV]` Auth UI: sign up / sign in / Google OAuth / forgot password / verify email,
      wired to Supabase (matches `apps/cloud/app/auth.py`).
- [ ] `[DEV]` Desktop OAuth via deep-link (Tauri) → store JWT securely.
- [ ] `[DEV]` Dashboard: credit balance, current plan, month usage, recent videos
      (consume `GET /v1/me`).
- [ ] `[DEV]` Route AI text calls (`generateScript`/`generateTerms`) through the cloud
      LLM proxy so they debit credit; surface "out of credits" state.
- [ ] `[DEV]` Profile & Settings: account info, change password, language, delete account.
- [ ] `[QA]` Test credit debit/refund, concurrent overspend race, expired-token handling.
- [ ] `[PO]` Run `scripts/estimate_llm_cost.py --live` with a real key → finalize the
      per-credit budget and confirm tier credit grants.

**User UAT:** sign up → receive 30 credits → generate a script → balance drops correctly.

---

## Phase 2 — SePay payment + Subscription tiers (~2 weeks) ⭐ revenue starts

**Goal:** users can pay; revenue begins.

- [ ] `[DEV]` Integrate **SePay** for real: create payment QR/link, verify webhook
      signature, idempotency (extend `apps/cloud/app/payments.py`).
- [ ] `[DEV]` Subscription engine: Free / Creator / Studio plans; billing cycle, renewal,
      expiry, downgrade-to-Free; entitlements enforced server-side.
- [ ] `[DEV]` Credit-pack checkout; invoice/receipt history with VN VAT fields.
- [ ] `[DEV]` Pricing UI with **cards** (monthly/annual toggle, plan comparison) — no
      dropdowns; reuse `CardSelect`.
- [ ] `[DEV]` Entitlement gates in app (watermark, 1080p/4K, batch size) read from plan.
- [ ] `[QA]` SePay sandbox: pay → credits added; duplicate webhook → no double-credit;
      failed renewal → dunning; reconciliation SePay ↔ ledger.

**User UAT:** buy Creator via SePay → no-watermark + 1080p unlock → view invoice.

---

## Phase 3 — Batch & mass video management (~2 weeks) ⭐ differentiator

**Goal:** turn "mass production" into an attractive paid feature.

- [ ] `[DEV]` Local render queue in the sidecar: enqueue, retry, pause/resume, concurrency.
- [ ] `[DEV]` Batch generator: import topic list / CSV / Google Sheet → generate N videos;
      per-item progress; gate batch size by plan.
- [ ] `[DEV]` Video library: filter/search/status/re-render/delete; thumbnails.
- [ ] `[DEV]` Templates & brand kit (logo, colors, fonts, intro/outro).
- [ ] `[DEV]` Scheduled multi-platform posting (extend `upload_post.py`).
- [ ] `[QA]` Batch of 20 items; mid-run crash → resume; per-plan quota enforcement.

**User UAT:** enter 10 topics at night → 10 videos by morning → auto-posted on schedule.

---

## Phase 4 — Desktop + Landing + Hardening (~2 weeks)

**Goal:** package a real, trustworthy product — installs and just works, looks premium.

- [ ] `[DEV]` Auto-update signed (real updater pubkey, `latest.json`), system tray,
      native "render done" notification, open-output-folder.
- [ ] `[DEV]` First-run onboarding: detect/install ffmpeg, resource check, login flow.
- [ ] `[DEV]` Signed installers: macOS notarized `.dmg`, Windows code-signed `.msi/.exe`,
      Linux AppImage/`.deb`; CI build+sign+release automation.
- [ ] `[DEV]` Full landing: interactive pricing, features, FAQ, legal
      (ToS/Privacy/Refund/Cookie), SEO + OG + sitemap, vi/en.
- [ ] `[DEV]` In-app onboarding, empty/error states, transactional emails (welcome,
      receipt, low-credit, renewal-failed), help center.
- [ ] `[QA]` Full regression; security testing (rate limit, secrets, fraud); upgrade from
      a previous installed version.

**User UAT:** on 3 OSes — download → install → log in → buy → batch → auto-update.

---

## Phase 5 — Launch & Ops (~1 week + ongoing)

**Goal:** controlled launch + the base to scale.

- [ ] `[DEV]` Admin panel: users/plans/refunds/manual credit, usage view.
- [ ] `[DEV]` Product analytics (signup→paid funnel), revenue/MRR, Sentry, status page.
- [ ] `[DEV]` Ledger backup/DR + payment-incident runbook.
- [ ] `[PM]` Closed beta → soft launch → scale; collect feedback, measure funnel & churn.
- [ ] `[PO]` Expansion backlog: more video sources, ElevenLabs voices, USD/Stripe
      international, team/agency seats.

**DoD:** revenue & errors observable in real time; refunds/support smooth; expansion
roadmap defined.
