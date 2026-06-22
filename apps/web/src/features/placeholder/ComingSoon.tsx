import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/common/PageHeader";

interface ComingSoonProps {
  /** i18n key for the page title. */
  title: string;
  /** i18n key for the supporting description. */
  description: string;
  /** Roadmap phase this surface ships in, e.g. "Phase 2". */
  phase?: string;
}

/**
 * Placeholder for routes whose feature lands in a later phase. Keeps the app
 * shell navigable and demonstrates the empty-state pattern (title + what's
 * next + when), rather than a blank screen.
 */
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t(title)} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="bg-zinc-800/50 text-zinc-500 grid size-14 place-items-center rounded-2xl">
          <Construction className="size-6" />
        </div>
        <div>
          <p className="font-medium text-zinc-200">{t("Coming soon")}</p>
          <p className="text-zinc-500 mt-1 max-w-md text-sm">
            {t(description)}
          </p>
        </div>
        {phase ? (
          <span className="bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-semibold">
            {t("Planned for {{phase}}", { phase })}
          </span>
        ) : null}
      </main>
    </div>
  );
}
