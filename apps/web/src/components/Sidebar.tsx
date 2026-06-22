import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { AccountMenu } from "@/components/AccountMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useUI } from "@/store/ui";

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
                <Icon className={cn("size-4 shrink-0", isActive && "text-foreground")} />
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
          <div className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-lg">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden>
              <path d="M7 10 L14 16 L21 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 15 L14 21 L21 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-foreground text-[15px] font-semibold tracking-tight">
              Vidova
            </span>
          )}
        </div>
      </div>

      {/* Primary nav */}
      <nav className={cn("flex flex-col gap-1 pt-3", collapsed ? "px-0" : "px-2.5")}>
        {!collapsed && (
          <p className="text-muted-foreground/70 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {t("Studio")}
          </p>
        )}
        <NavItems items={PRIMARY_NAV} collapsed={collapsed} />
      </nav>

      {/* Account avatar → popover */}
      <div
        className={cn(
          "border-sidebar-border mt-auto border-t py-2.5",
          collapsed ? "flex w-full justify-center px-0" : "px-2",
        )}
      >
        <AccountMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
