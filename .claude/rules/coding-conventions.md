# Coding conventions

- **Match surrounding code.** Mirror the file's existing style, naming, comment density,
  and idioms before introducing your own.
- **Comments explain *why*, not *what*.** Keep them sparse and high-signal.
- **TypeScript**: strict. No `any` escape hatches in app code. Run `pnpm typecheck` before
  declaring done. Path alias `@/` → `apps/web/src`. Shared types come from `@mpt/shared`.
- **Python (render + cloud)**: type hints on public functions. Keep the render pipeline
  contract intact (see `.claude/references/architecture.md`). Provider/source patterns
  (`material.py`, `llm.py`) are the extension points — add a provider, don't fork the flow.
- **Imports**: group stdlib / third-party / local. Frontend uses the repo's existing
  import ordering (eslint-sorted).
- **No dead code / no speculative abstractions.** Build what the task needs.
- **Errors**: surface the real cause. The web app distinguishes auth errors (401/403 →
  reauth) from network errors (cloud unreachable) — keep that distinction; don't collapse
  every failure into "couldn't reach".
- **Cross-platform**: paths via `os.path`/`pathlib` (render runs on macOS/Win/Linux as a
  sidecar). Don't hard-code POSIX paths.
- **Verify, don't guess.** Reproduce a bug before fixing it; the user expects tested fixes,
  not speculation. State outcomes plainly (what passed, what was skipped).
