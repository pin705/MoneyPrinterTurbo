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
        <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
          {label}
        </Label>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground/60 size-3 cursor-help" />
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
  className?: string;
  children: React.ReactNode;
}

export function Section({ icon, title, className, children }: SectionProps) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col rounded-xl border shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {icon ? (
          <span className="text-primary [&_svg]:size-4">{icon}</span>
        ) : null}
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  );
}
