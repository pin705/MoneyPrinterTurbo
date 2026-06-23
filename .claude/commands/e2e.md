---
description: Run the full verification pass — typecheck, web e2e, cloud unit tests
allowed-tools: Bash, Read
---

Run the project's verification suite and report a concise pass/fail table.

1. **Typecheck**: `pnpm typecheck` (workspace, excludes desktop).
2. **Web e2e**: `pnpm --filter @mpt/web test:e2e` (Playwright; builds with
   `VITE_FORCE_DEV_AUTH=1`). Avoid running while a heavy render/ffmpeg job is active —
   CPU contention causes false timeouts.
3. **Cloud unit tests**: `(cd apps/cloud && uv run --no-project --with-requirements requirements.txt --with pytest python -m pytest tests/ -q)`.
   These are hermetic — do NOT pass `--env-file`.

For any failure, show the relevant output and diagnose the real cause before proposing a
fix. Remember: SQLite (tests) doesn't enforce FKs, Postgres (prod) does — a green cloud
suite doesn't prove FK-ordering correctness. If you changed routes or labels, the e2e
expects default route `/ → /plan` and `localStorage["mpt-lang"]="en"`.
