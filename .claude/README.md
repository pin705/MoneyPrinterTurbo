# .claude — project operating kit for Vidova

Tailored Claude Code configuration for this monorepo. Start with the
`vidova-architecture` skill, then dive into the area you're touching.

## Layout
- **`skills/`** — auto-loaded knowledge.
  - `vidova-architecture` — repo map, where code goes, run/build/deploy.
  - `render-pipeline` — deep guide to `apps/render` (video generation).
- **`agents/`** — specialist subagents (invoke via the Agent tool / FleetView):
  `render-backend`, `cloud-backend`, `web-frontend`, `desktop-tauri`, `i18n-reviewer`.
- **`commands/`** — slash commands: `/dev`, `/render-video`, `/e2e`, `/deploy-cloud`,
  `/release-desktop`, `/i18n-sync`.
- **`workflows/`** — multi-agent scripts for the Workflow tool: `review-changes`, `i18n-audit`.
- **`rules/`** — conventions that always apply: coding, design-system, i18n, secrets, testing.
- **`references/`** — factual docs: `architecture`, `key-paths`, `deployment`.

## Golden rules (see `rules/`)
1. Vietnamese-first; default UI locale is `vi`; every string gets a `vi.ts` entry.
2. Monochrome Cursor-grade UI; design tokens only.
3. Never commit secrets; `.env.example` = placeholders; rotate anything leaked.
4. The render pipeline contract must never break.
5. Verify, don't guess — reproduce bugs, run tests, inspect real output.

Product context: `docs/VIDOVA_MASTERPLAN.md`, `docs/product/`.
