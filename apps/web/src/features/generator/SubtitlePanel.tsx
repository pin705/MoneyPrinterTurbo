import { Captions } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUBTITLE_POSITIONS } from "@mpt/shared";

import { Field, Section } from "@/components/common/Field";
import { OptSelect } from "@/components/common/OptSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useGenerator } from "@/store/generator";

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-border size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
        />
      </div>
    </Field>
  );
}

export function SubtitlePanel() {
  const { t } = useTranslation();
  const { params, setParam } = useGenerator();
  const enabled = params.subtitle_enabled ?? true;

  // text_background_color: false = off, otherwise a hex string.
  const bgColor =
    typeof params.text_background_color === "string"
      ? params.text_background_color
      : "#000000";
  const bgEnabled = params.text_background_color !== false;

  return (
    <Section icon={<Captions />} title={t("Subtitles")}>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="subEnabled" className="text-xs text-muted-foreground font-medium">
          {t("Enable subtitles")}
        </Label>
        <Switch
          id="subEnabled"
          checked={enabled}
          onCheckedChange={(on) => setParam("subtitle_enabled", on)}
        />
      </div>

      <div
        className={
          enabled ? "flex flex-col gap-4" : "pointer-events-none flex flex-col gap-4 opacity-50"
        }
      >
        <Field
          label={t("Font name")}
          htmlFor="font"
          hint={t("A font file under resource/fonts. Leave default if unsure.")}
        >
          <Input
            id="font"
            placeholder="STHeitiMedium.ttc"
            value={params.font_name ?? ""}
            onChange={(e) => setParam("font_name", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Position")} htmlFor="pos">
            <OptSelect
              id="pos"
              value={params.subtitle_position ?? "bottom"}
              onValueChange={(v) =>
                setParam("subtitle_position", v as typeof params.subtitle_position)
              }
              options={SUBTITLE_POSITIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          {params.subtitle_position === "custom" ? (
            <Field label={t("Custom position (% from top)")} htmlFor="custompos">
              <Input
                id="custompos"
                type="number"
                min={0}
                max={100}
                value={params.custom_position ?? 70}
                onChange={(e) => setParam("custom_position", Number(e.target.value))}
              />
            </Field>
          ) : (
            <div />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField
            id="fore"
            label={t("Font color")}
            value={params.text_fore_color ?? "#FFFFFF"}
            onChange={(v) => setParam("text_fore_color", v)}
          />
          <ColorField
            id="stroke"
            label={t("Stroke color")}
            value={params.stroke_color ?? "#000000"}
            onChange={(v) => setParam("stroke_color", v)}
          />
        </div>

        <Field label={`${t("Font size")}: ${params.font_size}`}>
          <Slider
            min={30}
            max={100}
            step={1}
            value={[params.font_size ?? 60]}
            onValueChange={([v]) => setParam("font_size", v)}
          />
        </Field>

        <Field label={`${t("Stroke width")}: ${params.stroke_width}`}>
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[params.stroke_width ?? 1.5]}
            onValueChange={([v]) => setParam("stroke_width", v)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <Label htmlFor="bgEnabled" className="text-xs text-muted-foreground font-medium">
            {t("Subtitle background")}
          </Label>
          <Switch
            id="bgEnabled"
            checked={bgEnabled}
            onCheckedChange={(on) =>
              setParam("text_background_color", on ? bgColor : false)
            }
          />
        </div>
        {bgEnabled ? (
          <>
            <ColorField
              id="bgcolor"
              label={t("Background color")}
              value={bgColor}
              onChange={(v) => setParam("text_background_color", v)}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="rounded" className="text-xs text-muted-foreground font-medium">
                {t("Rounded translucent background")}
              </Label>
              <Switch
                id="rounded"
                checked={params.rounded_subtitle_background ?? false}
                onCheckedChange={(on) =>
                  setParam("rounded_subtitle_background", on)
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </Section>
  );
}
