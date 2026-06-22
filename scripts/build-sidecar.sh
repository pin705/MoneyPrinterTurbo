#!/usr/bin/env bash
# Build the Python backend into a single binary and place it where Tauri's
# `externalBin` expects it: binaries/mpt-backend-<rust-target-triple>[.exe]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v pyinstaller >/dev/null 2>&1; then
  echo "pyinstaller not found. Install it in the backend env: pip install pyinstaller" >&2
  exit 1
fi

TRIPLE="$(rustc -Vv | grep '^host:' | cut -d' ' -f2)"
echo "Target triple: $TRIPLE"

pyinstaller --clean -y packaging/mpt-backend.spec

DEST="apps/desktop/src-tauri/binaries"
mkdir -p "$DEST"

EXT=""
case "$TRIPLE" in
  *windows*) EXT=".exe" ;;
esac

cp "dist/mpt-backend${EXT}" "$DEST/mpt-backend-${TRIPLE}${EXT}"
echo "Sidecar ready: $DEST/mpt-backend-${TRIPLE}${EXT}"
