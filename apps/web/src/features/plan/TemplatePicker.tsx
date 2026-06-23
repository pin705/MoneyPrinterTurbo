import {
  BadgePercent,
  Facebook,
  GraduationCap,
  Music2,
  Newspaper,
  Plane,
  ShoppingBag,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CONTENT_TEMPLATES, type ContentTemplate } from "@mpt/shared";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ShoppingBag,
  BadgePercent,
  Music2,
  Facebook,
  Youtube,
  GraduationCap,
  Plane,
  Newspaper,
};

/** Industry/platform starter cards — pick one to prefill the content-plan inputs. */
export function TemplatePicker({
  active,
  onPick,
}: {
  active?: string | null;
  onPick: (tpl: ContentTemplate) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CONTENT_TEMPLATES.map((tpl) => {
        const Icon = ICONS[tpl.icon] ?? Newspaper;
        const on = active === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(tpl)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
              "hover:border-foreground/30 hover:bg-accent",
              on
                ? "border-primary/60 bg-primary/5 ring-1 ring-ring/40"
                : "border-border bg-card",
            )}
          >
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium leading-tight">{t(tpl.titleKey)}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {t(tpl.descKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
