import { useQuery } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

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
        <span className="text-muted-foreground truncate">
          {online ? t("Backend connected") : t("Backend offline")}
        </span>
      )}
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
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
  const { collapsed, toggleCollapsed } = useUI();

  return (
    <aside
      className={cn(
        "bg-sidebar flex shrink-0 flex-col border-r border-border transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header with Logo + Collapse */}
      <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "flex-col gap-2 px-2 py-3" : "justify-between px-4")}>
        <div className={cn("flex items-center", collapsed ? "gap-0" : "gap-2.5")}>
          <div className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg shrink-0">
            <Sparkles className="size-4" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">
              Vid<span className="text-primary">ova</span>
            </span>
          )}
        </div>
        <button
          onClick={toggleCollapsed}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors",
            collapsed ? "p-1.5" : "p-1.5",
          )}
          title={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Primary Nav */}
      <nav className={cn("flex flex-col gap-0.5", collapsed ? "px-2 pt-3" : "px-3 pt-3")}>
        <NavItems items={PRIMARY_NAV} collapsed={collapsed} />
      </nav>

      {/* Account Nav */}
      <div className={cn("mt-6", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="text-muted-foreground/60 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
            {t("Account")}
          </p>
        )}
        {collapsed && <div className="border-t border-border mx-2 mb-2" />}
        <nav className="flex flex-col gap-0.5">
          <NavItems items={ACCOUNT_NAV} collapsed={collapsed} />
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-2 pb-3 pt-3 border-t border-border">
        <BackendStatus collapsed={collapsed} />
        <div className={cn(collapsed ? "px-2" : "px-3")}>
          <NavLink
            to="/settings"
            title={collapsed ? t("Settings") : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && <span>{t("Settings")}</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
