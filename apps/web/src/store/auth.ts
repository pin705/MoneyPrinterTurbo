import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Auth session state. The token is sent as a Bearer to the cloud backend.
 *
 * Today this uses a DEV sign-in: it mints a `dev:<uid>:<email>` token that the
 * cloud backend accepts when AUTH_DEV_MODE is on, so the whole account/credit/
 * billing flow is exercisable end-to-end without a Supabase project. Swapping in
 * real Supabase auth means replacing `signInDev` with a call that stores the
 * Supabase access token — the rest of the app (CloudClient + token) is unchanged.
 */
interface AuthState {
  token: string | null;
  email: string | null;
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
      signInDev: (email) =>
        set({ token: `dev:${devUid(email)}:${email}`, email }),
      signOut: () => set({ token: null, email: null }),
    }),
    { name: "mpt-auth" },
  ),
);
