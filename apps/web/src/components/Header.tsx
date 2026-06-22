import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SettingsDialog } from "@/components/SettingsDialog";
import { LANGUAGES, type LangCode } from "@/i18n";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/useApi";

function BackendStatus() {
  const { t } = useTranslation();
  const api = useApi();
  const { data: online } = useQuery({
    queryKey: ["ping"],
    queryFn: () => api.ping(),
    refetchInterval: 10_000,
  });

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-2 rounded-full",
          online
            ? "bg-primary shadow-[0_0_8px] shadow-primary"
            : "bg-muted-foreground/40",
        )}
      />
      <span className="text-muted-foreground hidden sm:inline">
        {online ? t("Backend connected") : t("Backend offline")}
      </span>
    </div>
  );
}

function LanguageToggle() {
  const { i18n } = useTranslation();
  const setLang = (code: LangCode) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem("mpt-lang", code);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-muted flex items-center rounded-md p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            i18n.resolvedLanguage === l.code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary grid size-8 place-items-center rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">
            MoneyPrinter <span className="text-primary">Studio</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <BackendStatus />
          <LanguageToggle />
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
}
