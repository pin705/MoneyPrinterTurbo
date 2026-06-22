import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase auth client. Enabled only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 * are set — otherwise the app falls back to dev sign-in (so local/e2e run without
 * a Supabase project). The cloud backend already verifies the Supabase JWT.
 *
 * PKCE flow keeps the OAuth/confirmation code in the `?code=` query string, which
 * does NOT collide with HashRouter's use of the URL hash.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseEnabled = !!(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** Where Supabase sends the user back after email confirmation / OAuth. */
const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;

export async function signInEmail(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns needsVerification=true when email confirmation is required (no session yet). */
export async function signUpEmail(
  email: string,
  password: string,
): Promise<{ needsVerification: boolean }> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return { needsVerification: !data.session };
}

export async function signInGoogle(): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOutSupabase(): Promise<void> {
  await supabase?.auth.signOut();
}
