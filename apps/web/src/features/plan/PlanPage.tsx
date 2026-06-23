import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Lightbulb,
  Loader2,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, type ContentIdea } from "@mpt/api-client";

import { PageHeader } from "@/components/common/PageHeader";
import { Field } from "@/components/common/Field";
import { OptSelect } from "@/components/common/OptSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/useApi";
import { useMe } from "@/lib/useCloud";
import { cn } from "@/lib/utils";
import { useGenerator } from "@/store/generator";

import { TemplatePicker } from "./TemplatePicker";

const COUNT_OPTS = [10, 20, 30, 50].map((n) => ({ value: String(n), label: String(n) }));

export function PlanPage() {
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();
  const me = useMe();
  const { params } = useGenerator();

  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [count, setCount] = useState(30);
  const [template, setTemplate] = useState<string | null>(null);

  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Per-plan batch cap from entitlements; generous fallback when cloud is off.
  const maxBatch = me.data?.entitlements.max_batch ?? 50;

  const plan = useMutation({
    mutationFn: () =>
      api.generateContentPlan({
        niche,
        audience,
        topic,
        count,
        tone,
        language: params.video_language,
      }),
    onSuccess: (data) => {
      setIdeas(data.ideas);
      // Pre-select up to the plan cap so "Send to batch" works in one click.
      setSelected(new Set(data.ideas.slice(0, maxBatch).map((_, i) => i)));
      if (data.ideas.length === 0) {
        toast.error(t("Couldn't generate ideas — try again"));
      }
    },
    onError: (e) =>
      toast.error(t("Generation failed"), {
        description: e instanceof ApiError ? e.message : String(e),
      }),
  });

  const batch = useMutation({
    mutationFn: () => {
      const subjects = ideas
        .filter((_, i) => selected.has(i))
        .map((x) => x.title)
        .slice(0, maxBatch);
      return api.createVideoBatch(subjects, params);
    },
    onSuccess: (res) => {
      toast.success(t("Queued {{n}} videos", { n: res.queued }));
      navigate("/library");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const allSelected = ideas.length > 0 && selected.size === ideas.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(ideas.map((_, i) => i)));

  const selectedCount = selected.size;
  const overCap = selectedCount > maxBatch;
  const canPlan = niche.trim().length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Content plan")}
        subtitle={t("Turn a niche into a batch of distinct video ideas")}
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left — inputs */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card flex flex-col gap-5 rounded-xl border border-border p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              <Lightbulb className="text-muted-foreground size-4" />
              {t("What do you make videos about?")}
            </div>

            <Field
              label={t("Start from a template")}
              hint={t("Pick an industry or platform to prefill the fields below.")}
            >
              <TemplatePicker
                active={template}
                onPick={(tpl) => {
                  setTemplate(tpl.id);
                  setNiche(tpl.niche);
                  setAudience(tpl.audience);
                  setTone(tpl.tone);
                  setTopic(tpl.topic);
                }}
              />
            </Field>

            <Field label={t("Niche")} htmlFor="niche" hint={t("The topic area of your channel.")}>
              <Input
                id="niche"
                placeholder={t("e.g. personal finance for beginners")}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </Field>

            <Field label={t("Audience")} htmlFor="audience">
              <Input
                id="audience"
                placeholder={t("e.g. Gen Z in Vietnam, new to investing")}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("How many ideas")} htmlFor="count">
                <OptSelect
                  id="count"
                  value={String(count)}
                  onValueChange={(v) => setCount(Number(v))}
                  options={COUNT_OPTS}
                />
              </Field>
              <Field label={t("Tone")} htmlFor="tone">
                <Input
                  id="tone"
                  placeholder={t("e.g. punchy")}
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </Field>
            </div>

            <Field label={t("Extra focus")} htmlFor="topic" hint={t("Optional. Steer the ideas toward something specific.")}>
              <Textarea
                id="topic"
                rows={2}
                placeholder={t("e.g. focus on saving habits and budgeting apps")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </Field>

            <Button onClick={() => plan.mutate()} disabled={!canPlan || plan.isPending} className="w-full">
              {plan.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {plan.isPending ? t("Generating…") : t("Generate ideas")}
            </Button>
            <p className="text-muted-foreground/70 text-center text-xs">
              {t("Each idea is a different angle — pick the ones you like.")}
            </p>
          </div>
        </div>

        {/* Right — ideas */}
        <div className="min-w-0">
          {ideas.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
              <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-xl">
                <Lightbulb className="size-6" />
              </div>
              <p className="font-medium text-foreground">{t("No ideas yet")}</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {t("Fill in your niche and audience, then generate a batch of ideas.")}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {ideas.length} {t("ideas")} ·{" "}
                  <span className="text-muted-foreground">
                    {selectedCount} {t("selected")}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="ml-auto">
                  {allSelected ? <Square /> : <CheckCheck />}
                  {allSelected ? t("Deselect all") : t("Select all")}
                </Button>
                <Button
                  size="sm"
                  disabled={selectedCount === 0 || batch.isPending}
                  onClick={() => batch.mutate()}
                >
                  {batch.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {t("Make")} {Math.min(selectedCount, maxBatch)} {t("videos")}
                  <ArrowRight />
                </Button>
              </div>

              {overCap ? (
                <div className="bg-warning/10 border-warning/25 mb-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <span className="text-foreground">
                    {t("Your plan makes up to {{n}} per batch — extras will wait.", { n: maxBatch })}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate("/billing")}>
                    {t("Upgrade")}
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {ideas.map((idea, i) => {
                  const on = selected.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggle(i)}
                      aria-pressed={on}
                      className={cn(
                        "group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        on
                          ? "border-primary/60 bg-primary/5"
                          : "border-border bg-card hover:border-foreground/20",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-transparent",
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
                          {idea.title}
                        </span>
                      </div>
                      {idea.hook ? (
                        <p className="text-muted-foreground pl-[26px] text-xs leading-relaxed">
                          “{idea.hook}”
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5 pl-[26px]">
                        {idea.angle ? (
                          <Badge variant="secondary" className="font-normal">
                            {idea.angle}
                          </Badge>
                        ) : null}
                        {idea.keywords.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[11px]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
