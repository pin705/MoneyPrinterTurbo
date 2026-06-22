import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { SettingsDialog } from "@/components/SettingsDialog";
import { LANGUAGES, type LangCode } from "@/i18n";
import { useApi } from "@/lib/useApi";
import { ACCOUNT_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function BackendStatus() {
  const { t } = useTranslation();
  const api = useApi();
  const { data: online } = useQuery({
    queryKey: ["ping"],
    queryFn: () => api.ping(),
    refetchInterval: 10_000,
  });
  return (
    <div className="flex items-center gap-2 px-3 text-xs">
      <span
        className={cn(
          "size-2 rounded-full",
          online
            ? "bg-primary shadow-[0_0_8px] shadow-primary"
            : "bg-muted-foreground/40",
        )}
      />
      <span className="text-muted-foreground">
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
    <div className="bg-muted mx-3 flex items-center rounded-md p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "flex-1 rounded px-2 py-1 text-xs font-medium transition-colors",
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

function NavItems({ items }: { items: NavItem[] }) {
  const { t } = useTranslation();
  return (
    <>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {t(it.labelKey)}
          </NavLink>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="bg-sidebar flex w-60 shrink-0 flex-col border-r">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="bg-primary/15 text-primary grid size-8 place-items-center rounded-lg">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">
          MoneyPrinter <span className="text-primary">Studio</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <NavItems items={PRIMARY_NAV} />
      </nav>

      <div className="mt-3 px-3">
        <p className="text-muted-foreground/70 px-3 pb-1 text-[11px] font-medium tracking-wide uppercase">
          {t("Account")}
        </p>
        <nav className="flex flex-col gap-1">
          <NavItems items={ACCOUNT_NAV} />
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4">
        <BackendStatus />
        <LanguageToggle />
        <div className="px-3">
          <SettingsDialog />
        </div>
      </div>
    </aside>
  );
}
