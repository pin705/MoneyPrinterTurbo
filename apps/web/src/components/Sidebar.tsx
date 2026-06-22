import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useApi } from "@/lib/useApi";
import { ACCOUNT_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUI } from "@/store/ui";

function BackendStatus({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const api = useApi();
  const { data: online } = useQuery({
    queryKey: ["ping"],
    queryFn: () => api.ping(),
    refetchInterval: 10_000,
  });
  const dot = (
    <span className="relative flex size-2 shrink-0 items-center justify-center">
      <span
        className={cn(
          "size-1.5 rounded-full",
          online ? "bg-primary" : "bg-muted-foreground/50",
        )}
      />
      {online && (
        <span className="bg-primary/40 absolute inline-flex size-2.5 animate-ping rounded-full" />
      )}
    </span>
  );
  const label = online ? t("Backend connected") : t("Backend offline");

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center py-1" aria-label={label}>
            {dot}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="text-muted-foreground flex items-center gap-2 px-2.5 text-xs">
      {dot}
      <span className="truncate">{label}</span>
    </div>
  );
}

function NavItems({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {items.map((it) => {
        const Icon = it.icon;
        const link = (
          <NavLink
            key={it.to}
            to={it.to}
            title={collapsed ? undefined : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex h-9 items-center rounded-md text-sm font-medium transition-colors duration-150",
                collapsed ? "w-9 justify-center" : "gap-2.5 px-2.5",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="bg-primary absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "",
                  )}
                />
                {!collapsed && <span className="truncate">{t(it.labelKey)}</span>}
              </>
            )}
          </NavLink>
        );
        if (!collapsed) return link;
        return (
          <Tooltip key={it.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{t(it.labelKey)}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const { collapsed } = useUI();

  return (
    <aside
      className={cn(
        "bg-sidebar flex shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-200 ease-out",
        collapsed ? "w-16 items-center" : "w-60",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden>
              <path d="M8 13L12.5 9L17 13L21 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 18.5L12.5 14.5L17 18.5L21 14.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Vid<span className="text-primary">ova</span>
            </span>
          )}
        </div>
      </div>

      {/* Primary Nav */}
      <nav className={cn("flex flex-col gap-1 pt-3", collapsed ? "px-0" : "px-2.5")}>
        {!collapsed && (
          <p className="text-muted-foreground/70 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {t("Studio")}
          </p>
        )}
        <NavItems items={PRIMARY_NAV} collapsed={collapsed} />
      </nav>

      {/* Account Nav */}
      <div className={cn("mt-5 flex flex-col gap-1", collapsed ? "px-0" : "px-2.5")}>
        {!collapsed ? (
          <p className="text-muted-foreground/70 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {t("Account")}
          </p>
        ) : (
          <div className="border-sidebar-border mx-3 my-1 border-t" />
        )}
        <NavItems items={ACCOUNT_NAV} collapsed={collapsed} />
      </div>

      {/* Bottom */}
      <div
        className={cn(
          "border-sidebar-border mt-auto flex flex-col gap-2 border-t py-3",
          collapsed ? "w-full items-center px-0" : "px-2.5",
        )}
      >
        <BackendStatus collapsed={collapsed} />
        {(() => {
          const link = (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "group relative flex h-9 items-center rounded-md text-sm font-medium transition-colors duration-150",
                  collapsed ? "w-9 justify-center" : "gap-2.5 px-2.5",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              <Settings className="size-4 shrink-0" />
              {!collapsed && <span>{t("Settings")}</span>}
            </NavLink>
          );
          if (!collapsed) return link;
          return (
            <Tooltip>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{t("Settings")}</TooltipContent>
            </Tooltip>
          );
        })()}
      </div>
    </aside>
  );
}
