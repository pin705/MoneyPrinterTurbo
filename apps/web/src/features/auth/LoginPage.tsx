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
      <div className="bg-card w-full max-w-sm rounded-2xl border p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="bg-primary/15 text-primary grid size-11 place-items-center rounded-xl">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            {t("Sign in to MoneyPrinter Studio")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("Sync credits and manage your subscription.")}
          </p>
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
            />
          </Field>
          <Button type="submit" className="w-full" disabled={!email.trim()}>
            {t("Continue")}
          </Button>
        </form>

        <p className="text-muted-foreground/70 mt-4 text-center text-xs">
          {t("Dev sign-in — Google/email auth wires in with Supabase.")}
        </p>
      </div>
    </div>
  );
}
