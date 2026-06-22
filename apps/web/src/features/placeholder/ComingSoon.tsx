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
        <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-2xl">
          <Construction className="size-6" />
        </div>
        <div>
          <p className="font-medium">{t("Coming soon")}</p>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            {t(description)}
          </p>
        </div>
        {phase ? (
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
            {t("Planned for {{phase}}", { phase })}
          </span>
        ) : null}
      </main>
    </div>
  );
}
