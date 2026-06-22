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
        <div className="bg-zinc-900/50 flex flex-col gap-4 rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Layers className="size-4 text-emerald-400" /> {t("Topics")}
            <span className="text-zinc-500 ml-auto text-xs tabular-nums">
              {subjects.length} / {maxBatch}
            </span>
          </div>
          <Textarea
            rows={8}
            placeholder={t("One topic per line…")}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
          />
          <p className="text-zinc-500 text-xs">
            {t("Shared look comes from the Create tab. Each line becomes one video.")}
          </p>

          {overLimit ? (
            <div className="bg-zinc-800/50 flex items-center justify-between rounded-xl border border-zinc-700/50 p-4 text-sm">
              <span className="text-zinc-300">
                {t("Your plan allows {{n}} per batch.", { n: maxBatch })}
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate("/billing")} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                {t("Upgrade")}
              </Button>
            </div>
          ) : null}

          <Button
            className="self-start bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
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
                className="bg-zinc-900/50 flex items-center gap-3 rounded-xl border border-zinc-800/50 px-5 py-4"
              >
                <ItemIcon state={task.state} />
                <span className="flex-1 truncate text-sm text-zinc-300">
                  {task.script?.slice(0, 60) || `${t("Video")} ${i + 1}`}
                </span>
                {task.state === TaskState.PROCESSING ? (
                  <Progress value={task.progress ?? 0} className="w-32 bg-zinc-800 [&>div]:bg-emerald-500" />
                ) : (
                  <span className="text-zinc-500 text-xs tabular-nums">
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
    return <CheckCircle2 className="text-emerald-400 size-4 shrink-0" />;
  if (state === TaskState.FAILED)
    return <XCircle className="text-red-400 size-4 shrink-0" />;
  return <Loader2 className="text-zinc-500 size-4 shrink-0 animate-spin" />;
}
