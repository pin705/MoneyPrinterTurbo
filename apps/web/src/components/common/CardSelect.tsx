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
  /** Accessible name. Prefer `aria-labelledby` to reference a visible label. */
  "aria-label"?: string;
  /** Id of a visible label element that names the group. */
  "aria-labelledby"?: string;
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
 * group: roving tabindex (exactly one tabbable option), arrow-key navigation,
 * and focus follows selection per the WAI-ARIA radiogroup pattern.
 */
export function CardSelect<T extends string = string>({
  value,
  onValueChange,
  options,
  columns = 2,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: CardSelectProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Exactly one option carries tabIndex=0 (roving tabindex): the selected and
  // enabled one, otherwise the first enabled option. This keeps the group
  // keyboard-reachable even when `value` matches nothing or points at a
  // disabled option.
  const selectedIdx = options.findIndex((o) => o.value === value && !o.disabled);
  const tabbableIdx =
    selectedIdx >= 0 ? selectedIdx : options.findIndex((o) => !o.disabled);

  const move = (dir: 1 | -1) => {
    const enabled = options
      .map((o, i) => ({ o, i }))
      .filter((x) => !x.o.disabled);
    if (enabled.length === 0) return;
    const pos = enabled.findIndex((x) => x.o.value === value);
    const start = pos === -1 ? 0 : pos;
    const next = enabled[(start + dir + enabled.length) % enabled.length];
    onValueChange(next.o.value);
    // Focus must follow selection (WAI-ARIA). focus() works before the
    // re-render flips tabIndex, and on a tabIndex=-1 element.
    refs.current[next.i]?.focus();
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
      aria-label={ariaLabelledby ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledby}
      onKeyDown={onKeyDown}
      className={cn("grid gap-2", COLS[columns], className)}
    >
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            tabIndex={idx === tabbableIdx ? 0 : -1}
            onClick={() => !opt.disabled && onValueChange(opt.value)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-emerald-500/50 bg-emerald-500/10 text-zinc-100"
                : "border-zinc-800/50 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700/50 hover:bg-zinc-800/50",
            )}
          >
            {opt.icon != null && (
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center [&_svg]:size-5",
                  selected ? "text-emerald-400" : "text-zinc-500",
                )}
              >
                {opt.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-sm font-medium", selected ? "text-zinc-100" : "text-zinc-300")}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {opt.description}
                </span>
              )}
            </span>
            <Check
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0 text-emerald-400 transition-opacity",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
