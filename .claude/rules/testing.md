# Testing & verification

- **Web e2e**: Playwright (`apps/web/e2e/`). The webServer builds with `VITE_FORCE_DEV_AUTH=1`
  and serves a preview; dev sign-in reveals the shell. Run `pnpm --filter @mpt/web test:e2e`.
  - Pin language: `localStorage["mpt-lang"]="en"` in a `beforeEach` `addInitScript` so
    label-based assertions don't break under the default VI locale.
  - The app's default route is `/` → `/plan` (content plan). Keep route assertions in sync.
- **Cloud unit tests**: `apps/cloud/tests/` via `pytest`. They are **hermetic** — they must
  NOT load a real `.env` (that previously broke test isolation). Run without `--env-file`.
- **Render**: verify a real render end-to-end through `/api/v1/videos` and poll
  `/api/v1/tasks/{id}`. Inspect the output mp4 (resolution, audio stream, burned subtitle).
- **Postgres vs SQLite gotcha**: SQLite (tests) does NOT enforce foreign keys; Postgres
  (prod) does. Flush parent rows before inserting children (this hid a real `current_user`
  FK bug). Don't trust "tests pass" alone for FK-ordering correctness.
- **Auth**: verify the real token path, not just a mock. A real ES256 token from Supabase
  must pass `/v1/me` (create user → grant credits → return plan).
- **Before declaring done**: `pnpm typecheck` + relevant tests green. Report failures with
  their output; never claim green without running.
