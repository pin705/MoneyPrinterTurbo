#!/usr/bin/env bash
# Vidova — cut a desktop release. Tags the current commit `desktop-v<version>`
# and pushes it, which triggers .github/workflows/desktop-build.yml to build the
# installers (macOS arm64+x64, Windows, Linux) + signed updater artifacts and
# publish a (draft) GitHub Release with latest.json.
#
#   scripts/release-desktop.sh            tag with the version in tauri.conf.json
#   scripts/release-desktop.sh 0.2.0      bump tauri.conf.json to 0.2.0, then tag
#
# Prereqs: clean git tree, the CI secret TAURI_SIGNING_PRIVATE_KEY set in the
# repo (Settings → Secrets), and push access to origin.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONF="apps/desktop/src-tauri/tauri.conf.json"
NEW_VERSION="${1:-}"

if [ -n "$NEW_VERSION" ]; then
  echo "▸ bumping $CONF → $NEW_VERSION"
  # Update the top-level "version" field in tauri.conf.json.
  tmp="$(mktemp)"
  node -e "const f='$CONF',j=require('./'+f);j.version='$NEW_VERSION';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
  git add "$CONF"
  git commit -m "chore(desktop): release v$NEW_VERSION"
fi

VERSION="$(node -p "require('./$CONF').version")"
TAG="desktop-v$VERSION"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree not clean. Commit or stash first." >&2
  exit 1
fi
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: tag $TAG already exists. Bump the version: scripts/release-desktop.sh <new-version>" >&2
  exit 1
fi

echo "▸ tagging $TAG and pushing…"
git tag -a "$TAG" -m "Vidova desktop $VERSION"
git push origin HEAD
git push origin "$TAG"

echo ""
echo "✓ Pushed $TAG. CI (Desktop build) is now building installers + updater."
echo "  Watch:   gh run watch \$(gh run list --workflow=desktop-build.yml -L1 --json databaseId -q '.[0].databaseId')"
echo "  Release: published as a DRAFT — review and publish it on GitHub Releases."
