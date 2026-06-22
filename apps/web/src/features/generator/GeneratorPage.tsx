import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/common/PageHeader";
import { GeneratorWizard } from "./GeneratorWizard";

export function GeneratorPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Create a video")}
        subtitle={t(
          "Topic in, finished short video out — rendered on your machine.",
        )}
      />
      <GeneratorWizard />
    </div>
  );
}
