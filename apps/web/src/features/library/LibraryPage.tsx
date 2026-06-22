import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  VideoOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TaskState, type TaskStateValue } from "@mpt/shared";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApi } from "@/lib/useApi";

const PAGE_SIZE = 12;

function StatusBadge({ state }: { state?: TaskStateValue }) {
  const { t } = useTranslation();
  if (state === TaskState.COMPLETE)
    return <Badge variant="success">{t("Complete")}</Badge>;
  if (state === TaskState.FAILED)
    return <Badge variant="destructive">{t("Failed")}</Badge>;
  return <Badge variant="secondary">{t("Processing")}</Badge>;
}

export function LibraryPage() {
  const { t } = useTranslation();
  const api = useApi();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ["tasks", page],
    queryFn: () => api.listTasks(page, PAGE_SIZE),
    refetchInterval: (q) =>
      q.state.data?.tasks.some((x) => x.state === TaskState.PROCESSING)
        ? 2000
        : false,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      toast.success(t("Video deleted"));
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tasks = list.data?.tasks ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Library")}
        subtitle={t("Your generated videos")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => list.refetch()}
              disabled={list.isFetching}
            >
              <RefreshCw className={list.isFetching ? "animate-spin" : ""} />
              {t("Refresh")}
            </Button>
            <Button size="sm" onClick={() => navigate("/create")}>
              <Plus /> {t("New video")}
            </Button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-8">
        {list.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-card overflow-hidden rounded-xl border border-border"
              >
                <div className="bg-muted aspect-[9/16] w-full animate-pulse" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-full animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-xl">
              <VideoOff className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("No videos yet")}</p>
              <p className="text-muted-foreground text-sm">
                {t("Create your first video to see it here.")}
              </p>
            </div>
            <Button onClick={() => navigate("/create")}>
              <Plus /> {t("Create a video")}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tasks.map((task) => {
                const id = task.task_id ?? "";
                const video = task.videos?.[0];
                const url = video ? api.fileUrl(video) : null;
                return (
                  <div
                    key={id}
                    className="group bg-card flex flex-col overflow-hidden rounded-xl border border-border shadow-xs transition-colors duration-150 hover:border-foreground/20"
                  >
                    <div className="bg-muted relative aspect-[9/16] w-full overflow-hidden">
                      {url ? (
                        <video
                          src={url}
                          controls
                          preload="metadata"
                          className="size-full object-contain"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
                          {task.state === TaskState.FAILED ? (
                            <VideoOff className="text-muted-foreground size-6" />
                          ) : (
                            <Loader2 className="text-primary size-6 animate-spin" />
                          )}
                          <Progress
                            value={task.progress ?? 0}
                            className="w-3/4"
                          />
                        </div>
                      )}
                      {/* hover-reveal delete */}
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        aria-label={t("Delete")}
                        onClick={() => del.mutate(id)}
                        disabled={del.isPending}
                        className="absolute right-2 top-2 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge state={task.state} />
                        <span className="text-muted-foreground/60 font-mono text-[11px]">
                          {id.slice(0, 8)}
                        </span>
                      </div>
                      {task.script ? (
                        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                          {task.script}
                        </p>
                      ) : (
                        <p className="text-muted-foreground/50 text-xs italic">
                          {t("No script")}
                        </p>
                      )}
                      {url ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-1 w-full"
                        >
                          <a href={url} download>
                            <Download /> {t("Download")}
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft /> {t("Previous")}
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {t("Page")} {page} / {totalPages} · {total} {t("videos")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {t("Next")} <ChevronRight />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
