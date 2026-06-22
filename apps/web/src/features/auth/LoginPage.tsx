import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/auth";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signInDev = useAuth((s) => s.signInDev);
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    signInDev(email.trim());
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="bg-zinc-900/50 w-full max-w-sm rounded-2xl border border-zinc-800/50 p-8 shadow-2xl shadow-zinc-900/50">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="bg-emerald-500/10 text-emerald-400 grid size-12 place-items-center rounded-2xl">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              {t("Sign in to Vidova")}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {t("Sync credits and manage your subscription.")}
            </p>
          </div>
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
              className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </Field>
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold" disabled={!email.trim()}>
            {t("Continue")}
          </Button>
        </form>

        <p className="text-zinc-600 mt-6 text-center text-xs">
          {t("Dev sign-in — Google/email auth wires in with Supabase.")}
        </p>
      </div>
    </div>
  );
}
