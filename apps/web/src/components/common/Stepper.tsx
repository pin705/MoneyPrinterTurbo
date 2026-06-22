import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = i <= current && !!onStepClick;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap text-sm font-medium transition-all duration-200",
                clickable && "cursor-pointer",
                active
                  ? "text-zinc-100"
                  : done
                    ? "text-zinc-300"
                    : "text-zinc-600",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-all duration-200",
                  active && "bg-emerald-500 text-black",
                  done && "bg-emerald-500/20 text-emerald-400",
                  !active && !done && "bg-zinc-800 text-zinc-500 border border-zinc-700",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors duration-200",
                  i < current ? "bg-emerald-500" : "bg-zinc-800",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
