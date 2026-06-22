import { Mic, Film, Hash, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COMMON_VOICES } from "@mpt/shared";

import { cn } from "@/lib/utils";
import { useGenerator } from "@/store/generator";

/**
 * A live 9:16 / 16:9 / 1:1 preview that reflects the chosen aspect ratio and
 * subtitle styling, plus a compact spec summary. Gives the build flow a visual
 * anchor so the form never feels like a wall of selects.
 */
export function PreviewPane() {
  const { t } = useTranslation();
  const { params } = useGenerator();

  const aspect = params.video_aspect ?? "9:16";
  const frame =
    aspect === "16:9"
      ? "aspect-video w-full"
      : aspect === "1:1"
        ? "aspect-square w-[78%]"
        : "aspect-[9/16] w-[62%]";

  const subEnabled = params.subtitle_enabled ?? true;
  const fg = params.text_fore_color ?? "#FFFFFF";
  const stroke = params.stroke_color ?? "#000000";
  const strokeW = params.stroke_width ?? 1.5;
  const pos = params.subtitle_position ?? "bottom";
  const bg = params.text_background_color;
  const align =
    pos === "top"
      ? "items-start pt-[14%]"
      : pos === "center"
        ? "items-center"
        : "items-end pb-[12%]";

  const subject =
    params.video_subject?.trim() ||
    (params.video_script ?? "").trim().slice(0, 60) ||
    t("Your topic here");

  const voiceLabel =
    COMMON_VOICES.find((v) => v.value === params.voice_name)?.labelKey ??
    params.voice_name ??
    "—";

  const specs = [
    { icon: Film, label: t("Source"), value: params.video_source ?? "pexels" },
    { icon: Mic, label: t("Voice"), value: t(voiceLabel) },
    { icon: Hash, label: t("Count"), value: String(params.video_count ?? 1) },
    {
      icon: Globe,
      label: t("Language"),
      value: params.video_language || t("Auto"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t("Preview")}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px]">
            {aspect}
          </span>
        </div>
        <div className="grid place-items-center rounded-lg border border-border bg-muted/30 p-5 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:13px_13px]">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-gradient-to-b from-neutral-800 to-neutral-950 shadow-md",
              frame,
            )}
          >
            <div className={cn("absolute inset-0 flex justify-center px-3 text-center", align)}>
              {subEnabled && (
                <span
                  className="max-w-full text-[11px] font-bold leading-tight"
                  style={{
                    color: fg,
                    WebkitTextStroke:
                      strokeW > 0 ? `${Math.min(strokeW, 2)}px ${stroke}` : undefined,
                    paintOrder: "stroke fill",
                    backgroundColor:
                      typeof bg === "string" ? `${bg}99` : undefined,
                    padding: typeof bg === "string" ? "1px 5px" : undefined,
                    borderRadius: params.rounded_subtitle_background ? 6 : 2,
                  }}
                >
                  {subject.slice(0, 42)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-1 shadow-xs">
        {specs.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-sm",
              i < specs.length - 1 && "border-b border-border",
            )}
          >
            <s.icon className="text-muted-foreground size-3.5 shrink-0" />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground ml-auto truncate font-medium capitalize">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
