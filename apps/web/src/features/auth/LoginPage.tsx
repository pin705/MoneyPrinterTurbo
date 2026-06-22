import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, MailCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isSupabaseEnabled,
  signInEmail,
  signInGoogle,
  signUpEmail,
} from "@/lib/supabase";
import { useAuth } from "@/store/auth";

function Shell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {t("Sign in to Vidova")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Sync credits and manage your subscription.")}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-4">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6c1.9-5.5 7-9.8 13.7-9.8z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z"/>
      <path fill="#FBBC05" d="M10.3 28.3c-.5-1.4-.8-3-.8-4.3s.3-2.9.8-4.3l-7.8-6C.9 16.9 0 20.3 0 24s.9 7.1 2.5 10.3l7.8-6z"/>
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.7 0-12.4-4.5-14.4-10.6l-7.8 6C6.4 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signInDev = useAuth((s) => s.signInDev);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifySent, setVerifySent] = useState(false);

  // --- Dev fallback: no Supabase env → simple email-only sign-in (local/e2e). ---
  if (!isSupabaseEnabled) {
    const devSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      signInDev(email.trim());
      navigate("/dashboard");
    };
    return (
      <Shell>
        <form onSubmit={devSubmit} className="flex flex-col gap-4">
          <Field label={t("Email")} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={!email.trim()}>
            {t("Continue")}
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          {t("Dev sign-in — set VITE_SUPABASE_URL/ANON_KEY for real auth.")}
        </p>
      </Shell>
    );
  }

  // --- Supabase: email/password + Google, with email verification on signup. ---
  if (verifySent) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
            <MailCheck className="size-6" />
          </div>
          <p className="font-medium text-foreground">{t("Check your email")}</p>
          <p className="text-muted-foreground text-sm">
            {t("We sent a confirmation link to {{email}}. Click it to activate your account.", { email })}
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              setVerifySent(false);
              setMode("signin");
            }}
          >
            {t("Back to sign in")}
          </Button>
        </div>
      </Shell>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { needsVerification } = await signUpEmail(email.trim(), password);
        if (needsVerification) {
          setVerifySent(true);
          return;
        }
        navigate("/dashboard");
      } else {
        await signInEmail(email.trim(), password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await signInGoogle(); // redirects away
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Shell>
      <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
        <GoogleIcon /> {t("Continue with Google")}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">{t("or")}</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t("Email")} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label={t("Password")} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email.trim() || !password}
        >
          {loading ? <Loader2 className="animate-spin" /> : null}
          {mode === "signup" ? t("Create account") : t("Sign in")}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {mode === "signup" ? (
          <>
            {t("Already have an account?")}{" "}
            <button
              className="text-primary font-medium hover:underline"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              {t("Sign in")}
            </button>
          </>
        ) : (
          <>
            {t("No account?")}{" "}
            <button
              className="text-primary font-medium hover:underline"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              {t("Create one")}
            </button>
          </>
        )}
      </p>
    </Shell>
  );
}
