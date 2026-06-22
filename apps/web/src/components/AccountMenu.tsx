import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LANGUAGES, type LangCode } from "@/i18n";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

const MENU = [
  { to: "/dashboard", labelKey: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", labelKey: "Billing", icon: CreditCard },
  { to: "/settings", labelKey: "Account", icon: Settings },
];

/**
 * Bottom-of-sidebar account avatar → popover menu (Cursor-style): one entry
 * point that gathers backend status, account routes, language and sign-out,
 * instead of scattering them across the sidebar.
 */
export function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const api = useApi();
  const { email, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: online } = useQuery({
    queryKey: ["ping"],
    queryFn: () => api.ping(),
    refetchInterval: 10_000,
  });

  const name = email ?? t("Signed in");
  const initial = (email?.trim()?.[0] ?? "V").toUpperCase();

  const setLang = (code: LangCode) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem("mpt-lang", code);
    } catch {
      /* ignore */
    }
  };

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const onSignOut = () => {
    setOpen(false);
    signOut();
    qc.clear();
    navigate("/login");
  };

  const avatar = (
    <span className="bg-secondary text-foreground grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold">
      {initial}
    </span>
  );

  const trigger = (
    <button
      className={cn(
        "group flex items-center rounded-md transition-colors duration-150",
        collapsed
          ? "size-9 justify-center"
          : "hover:bg-secondary/60 w-full gap-2.5 px-2 py-1.5",
        open && !collapsed && "bg-secondary/60",
      )}
      aria-label={t("Account")}
    >
      {avatar}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 text-left">
            <span className="text-foreground block truncate text-sm font-medium">
              {name}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  online ? "bg-foreground/70" : "bg-muted-foreground/40",
                )}
              />
              {online ? t("Backend connected") : t("Backend offline")}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </>
      )}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{name}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align={collapsed ? "center" : "start"}
        sideOffset={8}
        className="w-60 p-1.5"
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          {avatar}
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">{name}</p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  online ? "bg-foreground/70" : "bg-muted-foreground/40",
                )}
              />
              {online ? t("Backend connected") : t("Backend offline")}
            </p>
          </div>
        </div>

        <div className="bg-border my-1 h-px" />

        {MENU.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.to}
              onClick={() => go(m.to)}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
            >
              <Icon className="size-4" />
              {t(m.labelKey)}
            </button>
          );
        })}

        <div className="bg-border my-1 h-px" />

        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-muted-foreground text-xs">{t("Language")}</span>
          <div className="bg-secondary/60 flex items-center rounded-md p-0.5">
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
        </div>

        <div className="bg-border my-1 h-px" />

        <button
          onClick={onSignOut}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
        >
          <LogOut className="size-4" />
          {t("Sign out")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
