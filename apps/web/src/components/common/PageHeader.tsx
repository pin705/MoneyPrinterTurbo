import * as React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="bg-zinc-950/80 sticky top-0 z-30 flex items-center gap-4 border-b border-zinc-800/50 px-6 py-4 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-100">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-zinc-500 truncate text-xs">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
