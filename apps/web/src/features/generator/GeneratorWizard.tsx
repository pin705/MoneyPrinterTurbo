import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TaskState } from "@mpt/shared";

import { Stepper } from "@/components/common/Stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useGenerator } from "@/store/generator";
import { ContentPanel } from "./ContentPanel";
import { ReviewStep } from "./ReviewStep";
import { SubtitlePanel } from "./SubtitlePanel";
import { useVideoTask } from "./useVideoTask";
import { VideoAudioPanel } from "./VideoAudioPanel";

export function GeneratorWizard() {
  const { t } = useTranslation();
  const { params } = useGenerator();
  const { api, create, task, isRunning, reset } = useVideoTask();
  const [step, setStep] = useState(0);
  const [resultsOpen, setResultsOpen] = useState(false);

  const steps = [t("Content"), t("Video & Audio"), t("Subtitles"), t("Review")];
  const last = steps.length - 1;

  const state = task.data?.state;
  const progress = task.data?.progress ?? (create.isPending ? 2 : 0);
  const failed = state === TaskState.FAILED;
  const complete = state === TaskState.COMPLETE;
  const videos = task.data?.videos ?? [];
  const hasContent =
    !!params.video_subject.trim() || !!(params.video_script ?? "").trim();

  useEffect(() => {
    if (complete && videos.length > 0) setResultsOpen(true);
  }, [complete, videos.length]);

  const onGenerate = () => {
    if (!hasContent) {
      toast.error(t("Add a video subject or a script first"));
      setStep(0);
      return;
    }
    reset();
    setResultsOpen(false);
    create.mutate(params);
  };

  const body = [
    <ContentPanel key="content" />,
    <VideoAudioPanel key="va" />,
    <SubtitlePanel key="sub" />,
    <ReviewStep key="review" />,
  ][step];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
      <div className="mb-6">
        <Stepper steps={steps} current={step} onStepClick={setStep} />
      </div>

      <div className="flex-1">{body}</div>

      {(isRunning || failed) && (
        <div className="mt-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {failed ? (
                <>
                  <TriangleAlert className="text-destructive size-3.5" />
                  {t("Generation failed — check backend logs")}
                </>
              ) : (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {progress < 10
                    ? t("Generating script…")
                    : progress < 40
                      ? t("Synthesizing audio…")
                      : progress < 60
                        ? t("Downloading materials…")
                        : t("Rendering video…")}
                </>
              )}
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          {!failed && <Progress value={progress} />}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isRunning}
        >
          <ArrowLeft /> {t("Back")}
        </Button>

        {step < last ? (
          <Button
            onClick={() => setStep((s) => Math.min(last, s + 1))}
            disabled={step === 0 && !hasContent}
          >
            {t("Next")} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={onGenerate} disabled={isRunning} className="min-w-44">
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" /> {t("Generating…")}
              </>
            ) : (
              <>
                <Sparkles /> {t("Generate Video")}
              </>
            )}
          </Button>
        )}
      </div>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Your video is ready 🎬")}</DialogTitle>
            <DialogDescription>
              {videos.length} video{videos.length > 1 ? "s" : ""} ·{" "}
              {t("Preview and download below.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto sm:grid-cols-2">
            {videos.map((v, i) => {
              const url = api.fileUrl(v);
              return (
                <div key={i} className="flex flex-col gap-2">
                  <video
                    src={url}
                    controls
                    className="bg-muted aspect-[9/16] w-full rounded-lg object-contain"
                  />
                  <Button asChild variant="secondary" size="sm">
                    <a href={url} download>
                      <Download /> {t("Download")} #{i + 1}
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
