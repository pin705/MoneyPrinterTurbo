/**
 * Update checks, run once on launch. Two independent things are checked:
 *
 *  1. The desktop APP itself (Tauri auto-update) — desktop-only, no-op in a
 *     browser. This path is FREE: the updater verifies each download against the
 *     public key in tauri.conf.json (generated for free with `tauri signer
 *     generate`) and pulls artifacts from GitHub Releases. No paid service and
 *     no OS code-signing certificate are required for updates to apply.
 *
 *  2. The optional LOCAL AI image generator — works in both web and desktop
 *     because both talk to a local render backend. Footage is the default, so
 *     this only nudges when the user has turned local AI on but it isn't ready
 *     yet (deps/model missing). One-click setup runs the multi-GB install.
 *
 * Neither check may ever block or crash the app.
 */
import { MptClient } from "@mpt/api-client";
import { toast } from "sonner";

import i18n from "@/i18n";
import { API_BASE_URL } from "@/lib/api";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Tauri app auto-update: download, install and relaunch if a newer build exists. */
async function checkForAppUpdate(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return;

    toast(i18n.t("Update {{version}} available — downloading…", { version: update.version }));
    await update.downloadAndInstall();

    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (err) {
    console.warn("app update check failed", err);
  }
}

/**
 * Local-AI readiness check. Only surfaces a toast when the user has enabled
 * local AI but it still needs install/download — otherwise it's silent (footage
 * users are never nagged).
 */
async function checkForLocalAiUpdate(): Promise<void> {
  try {
    const client = new MptClient({ baseUrl: API_BASE_URL });
    const status = await client.checkAiUpdate();
    if (!status.enabled || !status.needs_setup) return;

    // Not enough disk → can't set up; tell them plainly, no action button.
    if (status.free_gb < status.min_free_gb) {
      toast.warning(
        i18n.t(
          "Local AI is on but only {{free}}GB free (needs ~{{need}}GB). Free up disk or use a cloud image key.",
          { free: status.free_gb, need: Math.round(status.min_free_gb) },
        ),
      );
      return;
    }

    toast(i18n.t("Local AI is on but not installed yet."), {
      duration: 12000,
      action: {
        label: i18n.t("Install now"),
        onClick: () => {
          toast.promise(client.setupAi(), {
            loading: i18n.t("Installing local AI (a few GB, one time)…"),
            success: i18n.t("Local AI ready."),
            error: i18n.t("Install failed — staying on stock footage."),
          });
        },
      },
    });
  } catch (err) {
    // Backend not up / feature absent — never block launch.
    console.warn("local AI update check skipped", err);
  }
}

/** Run all update checks on launch. Each is independently fail-safe. */
export async function checkForUpdates(): Promise<void> {
  await Promise.allSettled([checkForAppUpdate(), checkForLocalAiUpdate()]);
}
