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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={htmlFor}
          id={htmlFor ? `${htmlFor}-label` : undefined}
          className="text-muted-foreground text-xs font-medium"
        >
          {label}
        </Label>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                tabIndex={-1}
                aria-label="More info"
                className="text-muted-foreground/50 hover:text-muted-foreground inline-flex cursor-help transition-colors"
              >
                <Info className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{hint}</TooltipContent>
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
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Section({ icon, title, description, className, children }: SectionProps) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col rounded-xl border border-border shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        {icon ? (
          <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </section>
  );
}
