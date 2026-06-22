import { useQuery } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useEffect } from "react";

import { LANGUAGES, type LangCode } from "@/i18n";
import { useApi } from "@/lib/useApi";
import { ACCOUNT_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useUI } from "@/store/ui";

function BackendStatus({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const api = useApi();
  const { data: online } = useQuery({
    queryKey: ["ping"],
    queryFn: () => api.ping(),
    refetchInterval: 10_000,
  });
  return (
    <div className={cn("flex items-center gap-2 px-3 text-xs", collapsed && "justify-center")}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          online
            ? "bg-emerald-500 shadow-[0_0_6px] shadow-emerald-500/50"
            : "bg-zinc-500",
        )}
      />
      {!collapsed && (
        <span className="text-zinc-500 truncate">
          {online ? t("Backend connected") : t("Backend offline")}
        </span>
      )}
    </div>
  );
}

function LanguageToggle({ collapsed }: { collapsed: boolean }) {
  const { i18n } = useTranslation();
  const setLang = (code: LangCode) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem("mpt-lang", code);
    } catch {
      /* ignore */
    }
  };

  if (collapsed) {
    return (
      <div className="px-2">
        <div className="bg-zinc-200 dark:bg-zinc-800/50 flex items-center justify-center rounded-lg p-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
            className={cn(
              "rounded px-1.5 py-1 text-[10px] font-medium transition-all duration-150",
              i18n.resolvedLanguage === l.code
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 mx-3 flex items-center rounded-lg p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150",
            i18n.resolvedLanguage === l.code
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function NavItems({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            title={collapsed ? t(it.labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200",
              )
            }
          >
            <Icon className="size-4 shrink-0 transition-colors duration-150" />
            {!collapsed && <span className="truncate">{t(it.labelKey)}</span>}
          </NavLink>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const { collapsed, toggleCollapsed, toggleTheme, theme } = useUI();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <aside
      className={cn(
        "bg-zinc-50 dark:bg-zinc-950 flex shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800/50 transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header */}
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center px-2" : "gap-3 px-5")}>
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid size-9 place-items-center rounded-xl shrink-0">
          <Sparkles className="size-4" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Vid<span className="text-emerald-600 dark:text-emerald-400">ova</span>
          </span>
        )}
      </div>

      {/* Primary Nav */}
      <nav className={cn("flex flex-col gap-0.5", collapsed ? "px-2 pt-2" : "px-3 pt-2")}>
        <NavItems items={PRIMARY_NAV} collapsed={collapsed} />
      </nav>

      {/* Account Nav */}
      <div className={cn("mt-6", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="text-zinc-400 dark:text-zinc-600 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
            {t("Account")}
          </p>
        )}
        {collapsed && <div className="border-t border-zinc-200 dark:border-zinc-800/50 mx-2 mb-2" />}
        <nav className="flex flex-col gap-0.5">
          <NavItems items={ACCOUNT_NAV} collapsed={collapsed} />
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-3 pb-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
        <BackendStatus collapsed={collapsed} />
        <LanguageToggle collapsed={collapsed} />

        {/* Theme Toggle */}
        <div className={cn(collapsed ? "px-2" : "px-3")}>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 w-full",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
              "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            {theme === "dark" ? (
              <Sun className="size-4 shrink-0" />
            ) : (
              <Moon className="size-4 shrink-0" />
            )}
            {!collapsed && <span>{theme === "dark" ? t("Light mode") : t("Dark mode")}</span>}
          </button>
        </div>

        {/* Settings */}
        <div className={cn(collapsed ? "px-2" : "px-3")}>
          <NavLink
            to="/settings"
            title={collapsed ? t("Settings") : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
              "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && <span>{t("Settings")}</span>}
          </NavLink>
        </div>

        {/* Collapse Toggle */}
        <div className={cn(collapsed ? "px-2" : "px-3")}>
          <button
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 w-full",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
              "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" />
            )}
            {!collapsed && <span>{t("Collapse")}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
