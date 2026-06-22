import { Clapperboard, AudioLines, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BGM_TYPES,
  BGM_VOLUMES,
  CLIP_DURATIONS,
  COMMON_VOICES,
  CONCAT_MODES,
  TRANSITION_MODES,
  VIDEO_ASPECTS,
  VIDEO_COUNTS,
  VIDEO_SOURCES,
  VOICE_RATES,
  VOICE_VOLUMES,
  type VideoAspect,
  type VideoConcatMode,
  type VideoTransitionMode,
} from "@mpt/shared";

import { Combobox } from "@/components/common/Combobox";
import { Field, Section } from "@/components/common/Field";
import { OptSelect } from "@/components/common/OptSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGenerator } from "@/store/generator";

const NONE = "__none__";
const NO_BGM = "__nobgm__";
const numOpts = (arr: readonly number[]) =>
  arr.map((n) => ({ value: String(n), label: String(n) }));

export function VideoAudioPanel() {
  const { t } = useTranslation();
  const { params, setParam } = useGenerator();

  return (
    <div className="flex flex-col gap-4">
      <Section icon={<Clapperboard />} title={t("Video")}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Source")} htmlFor="src">
            <OptSelect
              id="src"
              value={params.video_source ?? "pexels"}
              onValueChange={(v) => setParam("video_source", v)}
              options={VIDEO_SOURCES.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("Aspect ratio")} htmlFor="aspect">
            <OptSelect
              id="aspect"
              value={params.video_aspect ?? "9:16"}
              onValueChange={(v) => setParam("video_aspect", v as VideoAspect)}
              options={VIDEO_ASPECTS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("Concat mode")} htmlFor="concat">
            <OptSelect
              id="concat"
              value={params.video_concat_mode ?? "random"}
              onValueChange={(v) =>
                setParam("video_concat_mode", v as VideoConcatMode)
              }
              options={CONCAT_MODES.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("Transition")} htmlFor="transition">
            <OptSelect
              id="transition"
              value={params.video_transition_mode ?? NONE}
              onValueChange={(v) =>
                setParam(
                  "video_transition_mode",
                  v === NONE ? null : (v as VideoTransitionMode),
                )
              }
              options={TRANSITION_MODES.map((o) => ({
                value: o.value ?? NONE,
                label: t(o.labelKey),
              }))}
            />
          </Field>
          <Field label={t("Clip duration (s)")} htmlFor="clip">
            <OptSelect
              id="clip"
              value={String(params.video_clip_duration ?? 3)}
              onValueChange={(v) => setParam("video_clip_duration", Number(v))}
              options={numOpts(CLIP_DURATIONS)}
            />
          </Field>
          <Field label={t("Video count")} htmlFor="count">
            <OptSelect
              id="count"
              value={String(params.video_count ?? 1)}
              onValueChange={(v) => setParam("video_count", Number(v))}
              options={numOpts(VIDEO_COUNTS)}
            />
          </Field>
        </div>

        <Accordion type="single" collapsible className="rounded-lg border px-3">
          <AccordionItem value="adv">
            <AccordionTrigger className="text-xs">
              <span className="flex items-center gap-2">
                <Settings2 className="size-3.5" />{" "}
                {t("Advanced video settings")}
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="match" className="text-xs">
                  {t("Match materials to script order")}
                </Label>
                <Switch
                  id="match"
                  checked={params.match_materials_to_script ?? false}
                  onCheckedChange={(on) =>
                    setParam("match_materials_to_script", on)
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section icon={<AudioLines />} title={t("Audio")}>
        <Field
          label={t("Voice")}
          htmlFor="voice"
          hint={t("Edge TTS voice. Match the language of your script.")}
        >
          <Combobox
            id="voice"
            value={params.voice_name || "en-US-JennyNeural-Female"}
            onValueChange={(v) => setParam("voice_name", v)}
            options={COMMON_VOICES.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            searchPlaceholder={t("Search voice…")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Voice volume")} htmlFor="vvol">
            <OptSelect
              id="vvol"
              value={String(params.voice_volume ?? 1.0)}
              onValueChange={(v) => setParam("voice_volume", Number(v))}
              options={numOpts(VOICE_VOLUMES)}
            />
          </Field>
          <Field label={t("Voice rate")} htmlFor="vrate">
            <OptSelect
              id="vrate"
              value={String(params.voice_rate ?? 1.0)}
              onValueChange={(v) => setParam("voice_rate", Number(v))}
              options={numOpts(VOICE_RATES)}
            />
          </Field>
          <Field label={t("Background music")} htmlFor="bgm">
            <OptSelect
              id="bgm"
              value={params.bgm_type ? params.bgm_type : NO_BGM}
              onValueChange={(v) => setParam("bgm_type", v === NO_BGM ? "" : v)}
              options={BGM_TYPES.map((o) => ({
                value: o.value || NO_BGM,
                label: t(o.labelKey),
              }))}
            />
          </Field>
          <Field label={t("BGM volume")} htmlFor="bgmvol">
            <OptSelect
              id="bgmvol"
              value={String(params.bgm_volume ?? 0.2)}
              onValueChange={(v) => setParam("bgm_volume", Number(v))}
              options={numOpts(BGM_VOLUMES)}
            />
          </Field>
        </div>
        {params.bgm_type === "custom" ? (
          <Field label={t("Custom BGM file")} htmlFor="bgmfile">
            <Input
              id="bgmfile"
              placeholder="filename in resource/songs"
              value={params.bgm_file ?? ""}
              onChange={(e) => setParam("bgm_file", e.target.value)}
            />
          </Field>
        ) : null}
      </Section>
    </div>
  );
}
