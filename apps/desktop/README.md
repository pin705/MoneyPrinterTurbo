# Vidova — Desktop (Tauri v2)

Wraps the React UI (`apps/web`) in a native window and spawns the Python backend
(`main.py`) as a **sidecar** — so video rendering runs locally on the user's
machine. Ships with a code-signed **auto-updater**.

```
┌ Tauri shell (Rust) ──────────────────────────────┐
│  WebView → apps/web (Vite build)                  │
│      │ localhost:8000                             │
│  spawns sidecar: binaries/mpt-backend-<triple>    │  ← PyInstaller(main.py)
│      env MPT_HOME = <app-data-dir>                │
└───────────────────────────────────────────────────┘
```

## One-time setup

1. **System build deps**
   - macOS: Xcode CLT.
   - Windows: VS Build Tools + WebView2.
   - Linux: `libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev librsvg2-dev patchelf pkg-config build-essential`
2. **Rust**: `curl https://sh.rustup.rs -sSf | sh`
3. **App icons**: drop a 1024×1024 `app-icon.png` in `apps/desktop/`, then
   `pnpm --filter @mpt/desktop icon` (generates `src-tauri/icons/*`).
4. **Updater keypair** (for auto-update):
   ```bash
   pnpm --filter @mpt/desktop tauri signer generate -w ~/.tauri/mpt.key
   ```
   Put the **public** key in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
   Add the **private** key + password as CI secrets `TAURI_SIGNING_PRIVATE_KEY`
   / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

## Dev

```bash
# from repo root, backend deps installed in your Python env:
pip install pyinstaller && bash scripts/build-sidecar.sh   # build the sidecar once
pnpm install
pnpm --filter @mpt/desktop dev          # launches web dev + Tauri window
```

`tauri dev` runs `beforeDevCommand` (web dev server on :5173) and opens the
window. The sidecar is spawned from `src-tauri/binaries/` — rebuild it whenever
the Python backend changes.

## Release

Build the sidecar, then:
```bash
pnpm --filter @mpt/desktop build        # installers in src-tauri/target/release/bundle
```
Or push a `desktop-v*` tag to run `.github/workflows/desktop-build.yml` (builds
macOS/Windows/Linux, signs, drafts a GitHub Release with `latest.json`).

## Known TODOs before shipping

- **Code signing certs**: Apple Developer ID (notarization) + Windows Authenticode
  — required so installers aren't blocked. Wire as CI secrets.
- **Bundle size**: onefile spec embeds `resource/` (~200 MB) and extracts on
  startup. For production, switch to onedir + ship `resource/` as Tauri
  `resources`, and download the Whisper model on first run.
- **Backend paths under freeze**: handled in `app/config/config.py` via
  `MPT_HOME` / `sys.frozen` — verify storage + fonts resolve on each OS.
