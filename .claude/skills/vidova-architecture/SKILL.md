---
name: vidova-architecture
description: Orientation for the Vidova codebase — the pnpm/turbo monorepo (render, cloud, web, desktop, landing), how the pieces connect, key paths, run/build commands, and deployment. Use when working across the repo, onboarding, deciding where code belongs, or answering "how does X work / where is Y".
---

# Vidova architecture skill

Vidova turns a topic into a finished short video, **rendered locally**; the cloud only
meters AI (credits) + billing. Vietnam-first (VND, SePay). Monochrome Cursor-grade UI.

Read these references (kept in sync with the code):
- `.claude/references/architecture.md` — the monorepo map + how render/cloud/web/desktop/landing connect.
- `.claude/references/key-paths.md` — exact files, commands, and config locations.
- `.claude/references/deployment.md` — Render/Vercel/GitHub-Releases deploy.

And the product context:
- `docs/VIDOVA_MASTERPLAN.md` — strategy/phases.
- `docs/product/PRICING-COST-MODEL.md` — monetization math.
- `docs/product/WORKFLOW.md` — team/process + the "GOAT" pipeline contract.

## Deciding where code goes
- Video generation / TTS / fonts / stock sources / sidecar → `apps/render/` (Python).
- Accounts, credits, plans, billing, SePay, LLM proxy → `apps/cloud/` (FastAPI).
- Any UI, routing, state, cloud-data binding → `apps/web/` (React).
- Desktop packaging, sidecar spawn, updater → `apps/desktop/` (Tauri).
- Marketing pages / showcase → `apps/landing/` (Astro).
- Types/option-lists/templates shared by web (and clients) → `packages/shared/`.
- Typed HTTP clients → `packages/api-client/`.

## Rules that always apply
`.claude/rules/` — coding conventions, the monochrome design system, VI-first i18n,
secrets/config handling, and testing/verification. Read the relevant rule before editing.

For deep render work, also see the `render-pipeline` skill.
