---
description: Cut a desktop release (tag desktop-v<ver> → CI builds installers + updater)
argument-hint: <version, e.g. 0.2.0 — omit to use the current tauri.conf.json version>
allowed-tools: Bash, Read
---

Cut a desktop release. Read `.claude/references/deployment.md` (Desktop section) first.

Pre-flight:
- Working tree clean (`git status --porcelain`).
- `apps/desktop/src-tauri/tauri.conf.json`: `bundle.createUpdaterArtifacts: true`, updater
  `endpoints` + `pubkey` set.
- Repo secret `TAURI_SIGNING_PRIVATE_KEY` exists in CI (matches the pubkey).
- Current version: !`node -p "require('./apps/desktop/src-tauri/tauri.conf.json').version"`

Then run `pnpm release:desktop $ARGUMENTS` (bumps version if a version arg is given, tags
`desktop-v<ver>`, pushes → triggers `.github/workflows/desktop-build.yml` for macOS arm64/x64,
Windows, Linux + signed updater + `latest.json`).

After pushing, report the tag and how to watch CI (`gh run list --workflow=desktop-build.yml`).
The GitHub Release is created as a **draft** — remind the user to review and publish it.

For a LOCAL production build instead (no release), use `pnpm build:desktop`.
