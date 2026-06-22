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
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {t("Sign in to Vidova")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
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
            />
          </Field>
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-semibold" disabled={!email.trim()}>
            {t("Continue")}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          {t("Dev sign-in — Google/email auth wires in with Supabase.")}
        </p>
      </div>
    </div>
  );
}
