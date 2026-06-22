import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { LANGUAGES, type LangCode } from "@/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
      <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { email, signOut } = useAuth();

  const setLang = (code: LangCode) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem("mpt-lang", code);
    } catch {
      /* ignore */
    }
  };

  const onSignOut = () => {
    signOut();
    // Drop any cached authenticated data so it can't leak to the next user.
    qc.clear();
    navigate("/login");
  };

  const onDelete = () => {
    // Real deletion calls a cloud endpoint (DELETE /v1/me) — wired with auth.
    toast(t("Account deletion is handled by support for now."));
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t("Account")} subtitle={t("Profile, language and account")} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <Card title={t("Profile")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">{email ?? t("Signed in")}</p>
              <p className="text-zinc-500 text-xs">{t("Signed in")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
              <LogOut /> {t("Sign out")}
            </Button>
          </div>
        </Card>

        <Card title={t("Language")}>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  i18n.resolvedLanguage === l.code
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700/50 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title={t("Danger zone")}>
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">
              {t("Permanently delete your account and data.")}
            </p>
            <Button variant="outline" size="sm" onClick={onDelete} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 /> {t("Delete account")}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
