import * as React from "react";
import { Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={htmlFor}
          id={htmlFor ? `${htmlFor}-label` : undefined}
          className="text-zinc-400 text-xs font-medium"
        >
          {label}
        </Label>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-zinc-600 size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-zinc-800 border-zinc-700 text-zinc-300">{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {children}
    </div>
  );
}

interface SectionProps {
  icon?: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function Section({ icon, title, className, children }: SectionProps) {
  return (
    <section
      className={cn(
        "bg-zinc-900/50 flex flex-col rounded-2xl border border-zinc-800/50",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-zinc-800/50 px-5 py-4">
        {icon ? (
          <span className="text-emerald-400 [&_svg]:size-4">{icon}</span>
        ) : null}
        <h2 className="text-sm font-semibold tracking-tight text-zinc-200">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </section>
  );
}
