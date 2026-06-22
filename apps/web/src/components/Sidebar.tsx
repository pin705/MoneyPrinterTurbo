import { useQuery } from "@tanstack/react-query";
import { Settings, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

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
          "size-1.5 rounded-full",
          online
            ? "bg-emerald-500 shadow-[0_0_6px] shadow-emerald-500/50"
            : "bg-zinc-500",
        )}
      />
      <span className="text-zinc-500">
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
    <div className="bg-zinc-800/50 mx-3 flex items-center rounded-lg p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150",
            i18n.resolvedLanguage === l.code
              ? "bg-zinc-700 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300",
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
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              )
            }
          >
            <Icon className="size-4 shrink-0 transition-colors duration-150" />
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
    <aside className="bg-zinc-950 flex w-60 shrink-0 flex-col border-r border-zinc-800/50">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="bg-emerald-500/10 text-emerald-400 grid size-9 place-items-center rounded-xl">
          <Sparkles className="size-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-zinc-100">
          Vid<span className="text-emerald-400">ova</span>
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-2">
        <NavItems items={PRIMARY_NAV} />
      </nav>

      <div className="mt-6 px-3">
        <p className="text-zinc-600 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
          {t("Account")}
        </p>
        <nav className="flex flex-col gap-0.5">
          <NavItems items={ACCOUNT_NAV} />
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 pt-4 border-t border-zinc-800/50">
        <BackendStatus />
        <LanguageToggle />
        <div className="px-3">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all duration-150"
          >
            <Settings className="size-4" />
            {t("Settings")}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
