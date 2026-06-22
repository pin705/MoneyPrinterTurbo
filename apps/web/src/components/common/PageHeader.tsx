import * as React from "react";
import { Moon, PanelLeft, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useUI } from "@/store/ui";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme, toggleCollapsed } = useUI();

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-4 backdrop-blur-xl">
      <button
        onClick={toggleCollapsed}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary -ml-1 grid size-8 shrink-0 place-items-center rounded-md transition-colors"
        title={t("Toggle sidebar")}
        aria-label={t("Toggle sidebar")}
      >
        <PanelLeft className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground -mt-0.5 truncate text-xs">{subtitle}</p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

      <button
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary grid size-8 shrink-0 place-items-center rounded-md transition-colors"
        title={theme === "dark" ? t("Light mode") : t("Dark mode")}
        aria-label={theme === "dark" ? t("Light mode") : t("Dark mode")}
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}
