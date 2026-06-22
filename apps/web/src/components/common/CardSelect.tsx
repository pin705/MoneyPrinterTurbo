import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CardOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional supporting line under the label. */
  description?: string;
  /** Optional leading icon (lucide icon element, emoji, or small preview). */
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CardSelectProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  options: CardOption<T>[];
  /** Grid columns. Defaults to 2. */
  columns?: 1 | 2 | 3 | 4;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

const COLS: Record<NonNullable<CardSelectProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/**
 * Card/box selector — the project's default over `<select>`/`OptSelect`.
 * Renders each choice as a clickable card with an icon, label and optional
 * description, plus a clear selected state. Behaves as an accessible radio
 * group (roving tabindex + arrow-key navigation).
 */
export function CardSelect<T extends string = string>({
  value,
  onValueChange,
  options,
  columns = 2,
  id,
  className,
  "aria-label": ariaLabel,
}: CardSelectProps<T>) {
  const enabled = options.filter((o) => !o.disabled);

  const move = (dir: 1 | -1) => {
    if (enabled.length === 0) return;
    const idx = enabled.findIndex((o) => o.value === value);
    const next = enabled[(idx + dir + enabled.length) % enabled.length];
    onValueChange(next.value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    }
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn("grid gap-2", COLS[columns], className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => !opt.disabled && onValueChange(opt.value)}
            className={cn(
              "group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border hover:bg-accent/50",
            )}
          >
            {opt.icon != null && (
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center [&_svg]:size-5",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {opt.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {opt.label}
              </span>
              {opt.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {opt.description}
                </span>
              )}
            </span>
            <Check
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0 text-primary transition-opacity",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
