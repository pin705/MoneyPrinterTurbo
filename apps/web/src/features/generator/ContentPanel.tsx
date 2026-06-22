import { useMutation } from "@tanstack/react-query";
import { Wand2, FileText, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@mpt/api-client";
import { SCRIPT_LANGUAGES } from "@mpt/shared";

import { Field, Section } from "@/components/common/Field";
import { OptSelect } from "@/components/common/OptSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/useApi";
import { useGenerator } from "@/store/generator";

const AUTO_LANG = "__auto__";

const DEFAULT_SYSTEM_PROMPT = `# Role: Video Script Generator

Generate a concise spoken script for a short video based on the subject.
Return only the raw narration text, no markdown, no titles, no stage directions.`;

export function ContentPanel() {
  const api = useApi();
  const { params, setParam } = useGenerator();

  const generate = useMutation({
    mutationFn: async () => {
      const { video_script } = await api.generateScript({
        video_subject: params.video_subject,
        video_language: params.video_language,
        paragraph_number: params.paragraph_number,
        video_script_prompt: params.video_script_prompt,
        custom_system_prompt: params.custom_system_prompt,
      });
      const { video_terms } = await api.generateTerms({
        video_subject: params.video_subject,
        video_script,
      });
      return { video_script, video_terms };
    },
    onSuccess: ({ video_script, video_terms }) => {
      setParam("video_script", video_script);
      setParam("video_terms", video_terms.join(", "));
      toast.success("Script & keywords generated");
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : String(e);
      toast.error("Generation failed", { description: msg });
    },
  });

  const useCustomPrompt = (params.custom_system_prompt ?? "").length > 0;
  const termsValue = Array.isArray(params.video_terms)
    ? params.video_terms.join(", ")
    : (params.video_terms ?? "");

  return (
    <Section icon={<FileText />} title="Content">
      <Field label="Video Subject" htmlFor="subject" hint="A keyword or topic — AI writes the script for you.">
        <Input
          id="subject"
          placeholder="e.g. 5 morning habits that boost productivity"
          value={params.video_subject}
          onChange={(e) => setParam("video_subject", e.target.value)}
        />
      </Field>

      <Field label="Script Language" htmlFor="lang">
        <OptSelect
          id="lang"
          value={params.video_language || AUTO_LANG}
          onValueChange={(v) =>
            setParam("video_language", v === AUTO_LANG ? "" : v)
          }
          options={SCRIPT_LANGUAGES.map((o) => ({
            value: o.value || AUTO_LANG,
            label: o.labelKey,
          }))}
        />
      </Field>

      <Accordion type="single" collapsible className="rounded-lg border px-3">
        <AccordionItem value="advanced">
          <AccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Settings2 className="size-3.5" /> Advanced script settings
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <Field
              label={`Paragraphs: ${params.paragraph_number}`}
              hint="How many paragraphs the script should contain (1-10)."
            >
              <Slider
                min={1}
                max={10}
                step={1}
                value={[params.paragraph_number ?? 1]}
                onValueChange={([v]) => setParam("paragraph_number", v)}
              />
            </Field>
            <Field label="Custom requirements" hint="Extra instructions, e.g. tone, audience, hook style.">
              <Textarea
                rows={3}
                placeholder="e.g. lighter tone, fit TikTok style, suspenseful opening"
                value={params.video_script_prompt ?? ""}
                onChange={(e) => setParam("video_script_prompt", e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between">
              <Label htmlFor="customsys" className="text-xs">
                Use custom system prompt
              </Label>
              <Switch
                id="customsys"
                checked={useCustomPrompt}
                onCheckedChange={(on) =>
                  setParam("custom_system_prompt", on ? DEFAULT_SYSTEM_PROMPT : "")
                }
              />
            </div>
            {useCustomPrompt ? (
              <Textarea
                rows={6}
                value={params.custom_system_prompt ?? ""}
                onChange={(e) => setParam("custom_system_prompt", e.target.value)}
              />
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        onClick={() => generate.mutate()}
        disabled={!params.video_subject.trim() || generate.isPending}
        className="w-full"
      >
        <Wand2 />
        {generate.isPending ? "Generating…" : "Generate Script & Keywords"}
      </Button>

      <Field label="Video Script" hint="Optional. AI-generated or write your own. Good punctuation helps subtitles.">
        <Textarea
          rows={8}
          placeholder="The narration text for your video…"
          value={params.video_script ?? ""}
          onChange={(e) => setParam("video_script", e.target.value)}
        />
      </Field>

      <Field label="Video Keywords" hint="English keywords, comma-separated. Used to find stock footage.">
        <Textarea
          rows={2}
          placeholder="morning routine, sunrise, productivity"
          value={termsValue}
          onChange={(e) => setParam("video_terms", e.target.value)}
        />
      </Field>
    </Section>
  );
}
