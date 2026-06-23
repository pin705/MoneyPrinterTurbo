# Vidova — Architecture reference

Vidova turns a topic into a finished short video, **rendered locally**. The cloud
only meters AI usage (credits) and handles accounts/billing — so infra cost ≈ 0.

## Monorepo (pnpm + turbo)

```
apps/
  render/    Python FastAPI — the render pipeline (GOAT). Port 8000.
  cloud/     FastAPI — accounts, credits, billing, LLM proxy. Port 8787.
  web/       React 19 + Vite + Tailwind 4 + shadcn. Port 5173 (dev).
  desktop/   Tauri v2 — bundles render/ as a PyInstaller sidecar.
  landing/   Astro static marketing site (VI-first). Port 4322.
packages/
  api-client/  Typed clients: MptClient (render) + CloudClient (accounts).
  shared/      Shared TS: option lists, video param types, content templates.
```

## The render pipeline (must never break — `apps/render/`)

`LLM script/terms → stock footage (Pexels/Pixabay/Coverr) → Edge TTS voiceover →
subtitles → ffmpeg/moviepy compose → final-N.mp4`

- Config: `config.toml` resolved from `MPT_HOME` (set by the desktop shell) or the
  render root. Holds `llm_provider` + keys, `*_api_keys` for stock sources, fonts.
- LLM is config-driven (`app/services/llm.py`), provider pattern.
- Material sources: `app/services/material.py` (`get_api_key("pexels_api_keys")` …).
- Voice: `app/services/voice.py` (Edge TTS; prefer async `stream()`, backoff on throttle).
- Subtitle font: language-aware default (vi → `BeVietnamPro-Bold.ttf`, zh → STHeiti).
- Durable task state: stdlib sqlite (`DbState`). Endpoints under `/api/v1/*`.

## Cloud (`apps/cloud/`)

- FastAPI + SQLModel. Tables auto-created via `init_db()` (`SQLModel.metadata.create_all`).
- **Auth**: Supabase JWTs. Modern projects sign **ES256** → verified via **JWKS**
  (`SUPABASE_URL`). Legacy HS256 shared secret is a fallback. `AUTH_DEV_MODE=1`
  accepts `dev:<uid>:<email>` tokens for local/e2e. See `app/auth.py`.
- **Credits/plans**: `plans.py`, `credits.py`, `subscriptions.py`. `/v1/me` returns
  balance + plan + entitlements.
- **Payments**: SePay bank-transfer, idempotent webhook (`payments.py`).
- Deploy: Docker → Render (free tier). DB: Supabase Postgres via the **pooler**
  (IPv4); the direct `:5432` host is IPv6-only and unreachable from most hosts.

## Web (`apps/web/`)

- HashRouter; full-screen auth gate (no token → LoginPage overlays everything).
- State: zustand (`store/generator`), TanStack Query for cloud data.
- i18n: English source strings ARE the keys; `i18n/vi.ts` holds VI; **default `vi`**.
- Design: monochrome OKLCH tokens (Cursor-like). Tokens only — no hard-coded hues
  for primary/accent. Status hues (success/warning/destructive) stay.
- Talks to: render backend (`VITE_API_BASE_URL`) + cloud (`VITE_CLOUD_BASE_URL`).

## Desktop (`apps/desktop/`)

- Tauri v2. Spawns the render backend as a sidecar (`externalBin "binaries/mpt-backend"`),
  sets `MPT_HOME` to the app-data dir. Free ed25519 updater → GitHub Releases `latest.json`.

## Where money/cost decisions live
`docs/VIDOVA_MASTERPLAN.md`, `docs/product/PRICING-COST-MODEL.md`, `docs/product/WORKFLOW.md`.
