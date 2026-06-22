import { useEffect, useState } from "react";
import { Download, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { TaskState } from "@mpt/shared";

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
import { useVideoTask } from "./useVideoTask";

export function GeneratePanel() {
  const { params } = useGenerator();
  const { api, create, task, isRunning, reset } = useVideoTask();
  const [resultsOpen, setResultsOpen] = useState(false);

  const state = task.data?.state;
  const progress = task.data?.progress ?? (create.isPending ? 2 : 0);
  const failed = state === TaskState.FAILED;
  const complete = state === TaskState.COMPLETE;
  const videos = task.data?.videos ?? [];

  useEffect(() => {
    if (complete && videos.length > 0) setResultsOpen(true);
  }, [complete, videos.length]);

  const onGenerate = () => {
    const hasContent =
      params.video_subject.trim() || (params.video_script ?? "").trim();
    if (!hasContent) {
      toast.error("Add a video subject or a script first");
      return;
    }
    reset();
    setResultsOpen(false);
    create.mutate(params);
  };

  return (
    <>
      <div className="bg-background/80 sticky bottom-0 z-40 border-t backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3">
          {(isRunning || failed) && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {failed ? (
                    <>
                      <TriangleAlert className="text-destructive size-3.5" />
                      Generation failed — check backend logs
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {progress < 10
                        ? "Generating script…"
                        : progress < 40
                          ? "Synthesizing audio…"
                          : progress < 60
                            ? "Downloading materials…"
                            : "Rendering video…"}
                    </>
                  )}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              {!failed && <Progress value={progress} />}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground hidden text-xs sm:block">
              Render runs locally · LLM via your configured provider
            </p>
            <div className="flex items-center gap-2">
              {complete && videos.length > 0 && (
                <Button variant="outline" onClick={() => setResultsOpen(true)}>
                  View results
                </Button>
              )}
              <Button
                size="lg"
                onClick={onGenerate}
                disabled={isRunning}
                className="min-w-44"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles /> Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your video is ready 🎬</DialogTitle>
            <DialogDescription>
              {videos.length} video{videos.length > 1 ? "s" : ""} generated.
              Preview and download below.
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
                      <Download /> Download #{i + 1}
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
