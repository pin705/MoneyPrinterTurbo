import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isSupabaseEnabled, signOutSupabase, supabase } from "@/lib/supabase";

/**
 * Auth session state. `token` is sent as a Bearer to the cloud backend.
 *
 * Two sources:
 *  - Supabase (when configured): the access token is mirrored here from the
 *    Supabase session and kept fresh via onAuthStateChange (incl. token refresh).
 *  - Dev fallback (no Supabase env): `signInDev` mints a `dev:<uid>:<email>`
 *    token the cloud accepts under AUTH_DEV_MODE — keeps local/e2e working.
 */
interface AuthState {
  token: string | null;
  email: string | null;
  /** Mirror a Supabase session (or clear it). */
  setSession: (token: string | null, email: string | null) => void;
  /** Dev-only sign-in (no Supabase). */
  signInDev: (email: string) => void;
  signOut: () => void;
}

/** Deterministic dev uid from an email so re-login returns the same account. */
function devUid(email: string): string {
  const slug = email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `dev-${slug || "user"}`;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      setSession: (token, email) => set({ token, email }),
      signInDev: (email) =>
        set({ token: `dev:${devUid(email)}:${email}`, email }),
      signOut: () => {
        // Drop the privileged admin key so it can't be inherited by the next
        // user on a shared browser. (Query cache is cleared in SettingsPage.)
        try {
          localStorage.removeItem("mpt-admin-key");
        } catch {
          /* ignore */
        }
        void signOutSupabase();
        set({ token: null, email: null });
      },
    }),
    { name: "mpt-auth" },
  ),
);

// Keep the store in sync with the live Supabase session (token refresh, OAuth /
// email-confirmation redirects, sign-out in another tab). Runs once at load.
if (isSupabaseEnabled && supabase) {
  const apply = (
    session: { access_token: string; user: { email?: string | null } } | null,
  ) =>
    useAuth
      .getState()
      .setSession(session?.access_token ?? null, session?.user?.email ?? null);

  void supabase.auth.getSession().then(({ data }) => apply(data.session));
  supabase.auth.onAuthStateChange((_event, session) => apply(session));
}
