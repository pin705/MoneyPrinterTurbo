import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LANGUAGES, type LangCode } from "@/i18n";
import { cn } from "@/lib/utils";
import { useUI } from "@/store/ui";

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme, collapsed, toggleCollapsed } = useUI();

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border px-4 py-2 backdrop-blur-xl">
      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapsed}
        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-2 transition-colors"
        title={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Language Toggle */}
      <LanguageToggle />

      <div className="w-px h-5 bg-border mx-1" />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-2 transition-colors"
        title={theme === "dark" ? t("Light mode") : t("Dark mode")}
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
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
    <div className="bg-muted flex items-center rounded-lg p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-all duration-150",
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
