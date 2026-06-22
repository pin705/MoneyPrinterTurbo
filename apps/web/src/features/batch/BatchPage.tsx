import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Layers, Loader2, Sparkles, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TaskState } from "@mpt/shared";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/useApi";
import { useMe } from "@/lib/useCloud";
import { useGenerator } from "@/store/generator";

export function BatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useApi();
  const me = useMe();
  const { params } = useGenerator();
  const [raw, setRaw] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);

  const subjects = useMemo(
    () => raw.split("\n").map((s) => s.trim()).filter(Boolean),
    [raw],
  );
  // Per-plan cap from entitlements; signed-out users get 1.
  const maxBatch = me.data?.entitlements.max_batch ?? 1;
  const overLimit = subjects.length > maxBatch;

  const run = useMutation({
    mutationFn: () => api.createVideoBatch(subjects.slice(0, maxBatch), params),
    onSuccess: (res) => {
      setTaskIds(res.task_ids);
      if (res.queued < res.requested) {
        toast.warning(
          t("Queued {{q}} of {{r}} — the queue is full, try the rest later", {
            q: res.queued,
            r: res.requested,
          }),
        );
      } else {
        toast.success(t("Queued {{n}} videos", { n: res.queued }));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Poll all queued tasks for per-item progress.
  const progress = useQuery({
    queryKey: ["batch", taskIds],
    enabled: taskIds.length > 0,
    queryFn: async () => Promise.all(taskIds.map((id) => api.getTask(id))),
    refetchInterval: (q) =>
      q.state.data?.some((x) => x.state === TaskState.PROCESSING) ? 2000 : false,
  });

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Batch")}
        subtitle={t("Mass-produce videos — one per topic")}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/library")}>
            {t("Open library")}
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="bg-card flex flex-col gap-4 rounded-xl border border-border shadow-xs p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Layers className="text-muted-foreground size-4" /> {t("Topics")}
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {subjects.length} / {maxBatch}
            </span>
          </div>
          <Textarea
            rows={8}
            placeholder={t("One topic per line…")}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="font-mono text-xs leading-relaxed"
          />
          <p className="text-muted-foreground text-xs">
            {t("Shared look comes from the Create tab. Each line becomes one video.")}
          </p>

          {overLimit ? (
            <div className="bg-warning/10 border-warning/25 flex items-center justify-between gap-3 rounded-lg border p-4 text-sm">
              <span className="text-foreground">
                {t("Your plan allows {{n}} per batch.", { n: maxBatch })}
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate("/billing")}>
                {t("Upgrade")}
              </Button>
            </div>
          ) : null}

          <Button
            className="self-start"
            disabled={subjects.length === 0 || run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {t("Generate")} {Math.min(subjects.length, maxBatch)} {t("videos")}
          </Button>
        </div>

        {progress.data && progress.data.length > 0 ? (
          <div className="mt-6 flex flex-col gap-2">
            {progress.data.map((task, i) => (
              <div
                key={taskIds[i]}
                className="bg-card flex items-center gap-3 rounded-lg border border-border px-4 py-3.5"
              >
                <ItemIcon state={task.state} />
                <span className="flex-1 truncate text-sm text-foreground">
                  {task.script?.slice(0, 60) || `${t("Video")} ${i + 1}`}
                </span>
                {task.state === TaskState.PROCESSING ? (
                  <Progress value={task.progress ?? 0} className="w-32" />
                ) : (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {task.state === TaskState.COMPLETE ? "100%" : t("Failed")}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ItemIcon({ state }: { state?: number }) {
  if (state === TaskState.COMPLETE)
    return <CheckCircle2 className="text-primary size-4 shrink-0" />;
  if (state === TaskState.FAILED)
    return <XCircle className="text-destructive size-4 shrink-0" />;
  return <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />;
}
