# Vidova — key paths & commands

## Run / build
| Command | What |
|---|---|
| `pnpm dev` | Full local stack (render :8000 + cloud :8787 + web :5173) via `scripts/dev.sh` |
| `pnpm dev:web` | Web only |
| `pnpm dev -- --no-cloud` | Stack without the cloud backend |
| `pnpm build` | Build web + landing + packages (excludes desktop) |
| `pnpm build:sidecar` | Build the Python render backend into the Tauri sidecar binary |
| `pnpm build:desktop` | Full desktop production build (sidecar → `tauri build`, signed) |
| `pnpm release:desktop [ver]` | Tag `desktop-v<ver>` + push → CI builds installers + updater |
| `pnpm --filter @mpt/web test:e2e` | Playwright e2e |
| `pnpm typecheck` / `pnpm lint` | Across the workspace |

## Render backend (Python)
- Entry: `apps/render/main.py` · pipeline in `apps/render/app/services/`
- `task.py` (orchestrator) · `llm.py` · `material.py` · `voice.py` · `video.py` · `subtitle.py`
- Config resolution: `apps/render/app/config/config.py` (`MPT_HOME` → `config.toml`)
- Fonts: `apps/render/resource/fonts/` · PyInstaller spec: `apps/render/packaging/mpt-backend.spec`
- Desktop config.toml lives at: `~/Library/Application Support/app.vidova.desktop/config.toml` (macOS)

## Cloud backend (Python)
- `apps/cloud/app/`: `main.py` (routes), `auth.py` (JWKS/JWT), `db.py`, `credits.py`,
  `plans.py`, `subscriptions.py`, `payments.py` (SePay), `llm_proxy.py`, `admin.py`
- Deploy: `apps/cloud/Dockerfile` + `railway.json` (also works on Render)
- Tests: `apps/cloud/tests/` (`pytest`, hermetic — no `.env`)

## Web (React)
- `apps/web/src/App.tsx` (routes + auth gate) · `store/generator.ts` · `lib/useCloud.ts`
- Features: `features/generator/` (create), `features/plan/` (content plan + templates),
  `features/library/`, `features/dashboard/`, `features/auth/`
- i18n: `src/i18n/index.ts` (default `vi`) + `src/i18n/vi.ts`
- Shared options/templates: `packages/shared/src/options.ts`

## Config / secrets (all gitignored; `.env.example` holds placeholders)
- `apps/web/.env` — `VITE_API_BASE_URL`, `VITE_CLOUD_BASE_URL`, `VITE_SUPABASE_*`
- `apps/cloud/.env` — `SUPABASE_URL`, `JWT_ALG`, `DATABASE_URL`, `DEEPSEEK_*`, `SEPAY_*`, `CORS_ALLOWED_ORIGINS`
- Tauri updater key: `~/.tauri/vidova-updater.key` (NEVER commit)
