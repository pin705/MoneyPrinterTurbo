/**
 * Tauri auto-update — runs ONLY inside the desktop app (no-op in a browser, so
 * it's safe in the shared web build / e2e).
 *
 * This path is FREE: the updater verifies each download against the public key
 * in tauri.conf.json (generated for free with `tauri signer generate`) and
 * pulls release artifacts from the configured GitHub Releases endpoint. No paid
 * service and no OS code-signing certificate are required for updates to apply
 * — an unsigned install just shows an OS "unidentified developer" warning on
 * first launch; updates still work.
 */
import { toast } from "sonner";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Check for an update on launch; download, install and relaunch if found. */
export async function checkForUpdates(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return;

    toast(`Update ${update.version} available — downloading…`);
    await update.downloadAndInstall();

    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (err) {
    // An update check must never block or crash the app.
    console.warn("update check failed", err);
  }
}
