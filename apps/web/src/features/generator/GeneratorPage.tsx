import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/common/PageHeader";
import { ContentPanel } from "./ContentPanel";
import { GeneratePanel } from "./GeneratePanel";
import { SubtitlePanel } from "./SubtitlePanel";
import { VideoAudioPanel } from "./VideoAudioPanel";

export function GeneratorPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Create a video")}
        subtitle={t("Topic in, finished short video out — rendered on your machine.")}
      />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ContentPanel />
          <VideoAudioPanel />
          <SubtitlePanel />
        </div>
      </main>
      <GeneratePanel />
    </div>
  );
}
