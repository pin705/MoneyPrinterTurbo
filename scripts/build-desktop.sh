#!/usr/bin/env bash
# Vidova — build the desktop app for production (installer + updater artifacts).
#
#   scripts/build-desktop.sh                 build for the host target triple
#   scripts/build-desktop.sh --target <t>    build for a specific triple
#
# Steps: build the Python backend sidecar → `tauri build` (signed so the updater
# can verify .sig). Outputs: apps/desktop/src-tauri/target/release/bundle/
#   macos/Vidova.app · dmg/Vidova_<ver>_<arch>.dmg
#   + the signed *.app.tar.gz / *.sig (updater) when a signing key is present.
#
# Requires: rust (rustc/cargo), pnpm, and the backend env (uv or pip) with
# pyinstaller. The Tauri updater signing key lives at ~/.tauri/vidova-updater.key
# (never commit it). Without it, the build still produces the installer but
# cannot sign updater artifacts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▸ [1/3] building backend sidecar…"
bash scripts/build-sidecar.sh

echo "▸ [2/3] installing JS deps…"
pnpm install --frozen-lockfile

echo "▸ [3/3] tauri build…"
KEY_FILE="${TAURI_KEY_FILE:-$HOME/.tauri/vidova-updater.key}"
if [ -f "$KEY_FILE" ]; then
  echo "  signing updater artifacts with $KEY_FILE"
  TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_FILE")" \
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" \
    pnpm --filter @mpt/desktop exec tauri build "$@"
else
  echo "  WARNING: no signing key at $KEY_FILE — installer only, no signed updater artifacts." >&2
  pnpm --filter @mpt/desktop exec tauri build "$@"
fi

echo ""
echo "✓ Done. Bundles:"
find apps/desktop/src-tauri/target -path '*/release/bundle/*' \
  \( -name '*.dmg' -o -name '*.app' -o -name '*.msi' -o -name '*.exe' \
     -o -name '*.deb' -o -name '*.AppImage' -o -name '*.sig' \) \
  -maxdepth 6 2>/dev/null | sed 's/^/  /'
