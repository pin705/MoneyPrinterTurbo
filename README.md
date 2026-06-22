<div align="center">
<h1>✦ Vidova</h1>
<p><strong>Turn a topic into a finished short video — script, footage, voiceover, subtitles — rendered on your own machine.</strong></p>
</div>

Vidova is an AI short-video studio. Type a topic; it writes the narration,
finds stock footage, voices it, adds subtitles, and renders a ready-to-post
video locally. The desktop app does the rendering (free, no server bill); a thin
cloud service meters the cheap AI text step and handles accounts, plans and
payments.

> Built on the open-source render engine originally from
> [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo);
> rebranded and extended into a full product.

## Monorepo layout

```
apps/render/         Render backend (FastAPI): LLM → footage → TTS → subtitles → ffmpeg
apps/web/            React 19 + Vite + Tailwind + shadcn — the studio UI (also the desktop webview)
apps/desktop/        Tauri v2 shell (bundles apps/render as a sidecar)
apps/landing/        Astro marketing site + legal pages
apps/cloud/          FastAPI: accounts, credits, plans/subscriptions, SePay payments, admin
packages/api-client/ Typed clients (MptClient = local render, CloudClient = accounts/billing)
packages/shared/     Shared TS types/options
docs/product/        Workflow, task breakdown, pricing/cost model, ops runbook
```

## Quick start (dev)

```bash
# 1. Install JS deps + Python env
pnpm install
(cd apps/render && uv sync)

# 2. Start everything (render backend + web) with one command:
pnpm dev:all
#   render API → http://127.0.0.1:8000   ·   web → http://localhost:5173
#   add the cloud backend too:  pnpm dev:all --cloud   (or: scripts/dev.sh --cloud)
```

Configure providers (Pexels/Pixabay, LLM keys) in `apps/render/config.toml`
(auto-created from `config.example.toml` on first run) or via the in-app
Settings dialog.

## Business model

- **Render is local** → ~zero infra cost, high margin.
- **Hybrid pricing**: Free + Creator/Studio subscriptions + credit top-ups.
- **Payments**: SePay (VND) — see `apps/cloud` and `docs/product/PRICING-COST-MODEL.md`.

## Tests

```bash
(cd apps/render && uv run python -m unittest test.services.test_state test.services.test_task \
  test.services.test_schema test.services.test_batch test.services.test_subtitle_background_settings)
(cd apps/cloud && AUTH_DEV_MODE=1 ADMIN_API_KEY=dev uv run --no-project \
  --with-requirements requirements.txt python -m unittest discover -s tests -p "test_*.py")
pnpm typecheck && pnpm --filter @mpt/web test:e2e
```

## Docs

- [Production workflow](docs/product/WORKFLOW.md) · [Task breakdown](docs/product/TASK-BREAKDOWN.md)
- [Pricing & cost model](docs/product/PRICING-COST-MODEL.md) · [Ops runbook](docs/product/OPS.md)
- [Desktop release & signing](apps/desktop/RELEASE.md) · [Brand / logo](brand/LOGO_PROMPT.md)

## License

MIT — see [LICENSE](LICENSE).
