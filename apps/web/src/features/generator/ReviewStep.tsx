import { useTranslation } from "react-i18next";
import { COMMON_VOICES } from "@mpt/shared";

import { Badge } from "@/components/ui/badge";
import { useGenerator } from "@/store/generator";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="truncate text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ReviewStep() {
  const { t } = useTranslation();
  const { params } = useGenerator();

  const voice =
    COMMON_VOICES.find((v) => v.value === params.voice_name)?.labelKey ??
    params.voice_name ??
    "—";
  const terms = Array.isArray(params.video_terms)
    ? params.video_terms.join(", ")
    : params.video_terms || "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-xl border border-border shadow-xs p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("Review")}</h3>
        <Row
          label={t("Video Subject")}
          value={params.video_subject || <span className="text-muted-foreground/60">—</span>}
        />
        <Row
          label={t("Script Language")}
          value={params.video_language || t("Auto Detect")}
        />
        <Row label={t("Source")} value={params.video_source} />
        <Row label={t("Aspect ratio")} value={params.video_aspect} />
        <Row label={t("Video count")} value={params.video_count} />
        <Row label={t("Voice")} value={voice} />
        <Row
          label={t("Subtitles")}
          value={
            params.subtitle_enabled ? (
              <Badge variant="success">{t("On")}</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">{t("Off")}</Badge>
            )
          }
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs p-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t("Video Keywords")}</h3>
        <p className="text-muted-foreground text-sm break-words">{terms}</p>
      </div>

      <p className="text-muted-foreground/70 text-center text-xs">
        {t("Render runs locally · LLM via your configured provider")}
      </p>
    </div>
  );
}
