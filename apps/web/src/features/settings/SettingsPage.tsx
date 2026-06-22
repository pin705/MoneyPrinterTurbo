import type { ReactNode } from "react";
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
    <div className="bg-card rounded-xl border p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
    navigate("/login");
  };

  const onDelete = () => {
    // Real deletion calls a cloud endpoint (DELETE /v1/me) — wired with auth.
    toast(t("Account deletion is handled by support for now."));
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t("Account")} subtitle={t("Profile, language and account")} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-6">
        <Card title={t("Profile")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{email ?? t("Signed in")}</p>
              <p className="text-muted-foreground text-xs">{t("Signed in")}</p>
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
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  i18n.resolvedLanguage === l.code
                    ? "border-primary bg-accent"
                    : "border-border text-muted-foreground hover:bg-accent/50",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title={t("Danger zone")}>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {t("Permanently delete your account and data.")}
            </p>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="text-destructive" /> {t("Delete account")}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
