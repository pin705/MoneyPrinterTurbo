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
    <div className="bg-card rounded-xl border border-border shadow-xs p-6">
      <h2 className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">{title}</h2>
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold uppercase">
                {(email ?? "U").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{email ?? t("Signed in")}</p>
                <p className="text-muted-foreground text-xs">{t("Signed in")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut}>
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
                  "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer",
                  i18n.resolvedLanguage === l.code
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title={t("Danger zone")}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              {t("Permanently delete your account and data.")}
            </p>
            <Button variant="outline" size="sm" onClick={onDelete} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 /> {t("Delete account")}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
