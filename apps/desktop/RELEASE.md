# Desktop release & signing

MoneyPrinter Studio ships as a Tauri v2 desktop app that bundles the Python
render backend as a sidecar (`binaries/mpt-backend`) and renders locally. This
doc is the checklist to cut a **signed, auto-updating** release. Items marked
🔑 require secrets you provide once (stored as CI secrets, never committed).

## 1. Auto-update signing (Tauri updater)

The updater verifies each release against a public key in `tauri.conf.json`
(`plugins.updater.pubkey`, currently a placeholder).

```bash
# Generate the keypair once. Keep the PRIVATE key secret.
pnpm --filter @mpt/desktop tauri signer generate -w ~/.tauri/mpt.key
```

- Put the **public** key in `tauri.conf.json` → `plugins.updater.pubkey`.
- 🔑 Add the **private** key + password as CI secrets
  `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- `tauri build` then emits `latest.json` + signed bundles; publish them to the
  GitHub release the updater endpoint points at.

## 2. macOS — code sign + notarize

🔑 Requires an Apple Developer account.

- `APPLE_CERTIFICATE` (base64 .p12) + `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY` (e.g. "Developer ID Application: …")
- `APPLE_ID` + `APPLE_PASSWORD` (app-specific) + `APPLE_TEAM_ID`

Tauri runs `codesign` then notarization automatically when these are set, then
staples the ticket. Output: a notarized `.dmg` that opens without Gatekeeper
warnings.

## 3. Windows — code sign

🔑 An OV/EV code-signing certificate (or Azure Trusted Signing).
Set `WINDOWS_CERTIFICATE` + `WINDOWS_CERTIFICATE_PASSWORD`; Tauri signs the
`.msi`/`.exe`. EV certs avoid SmartScreen warnings.

## 4. Linux

`.AppImage` and `.deb` need no signing. The AppImage is what the updater serves.

## 5. CI

`.github/workflows/desktop-build.yml` builds the matrix (macOS/Windows/Linux).
Add the secrets above to the repo; the workflow injects them at build time and
uploads artifacts to the release. Until the signing secrets exist, builds are
**unsigned** (fine for internal testing, not for public distribution).

## 6. First-run on the user's machine

The app expects `ffmpeg` for local rendering. The onboarding flow should detect
it and offer to install (Tauri shell can run the platform package manager) or
point to the bundled binary. Document the minimum specs (≥4 GB RAM) so weak
machines fail gracefully with a clear message rather than a stuck render.

> Native niceties to layer in next (Rust, in `src-tauri/src/lib.rs`): a system
> tray, a "render complete" notification, and an open-output-folder action.
> These need the Rust toolchain to build/verify and are intentionally left as a
> follow-up rather than shipped unverified.
