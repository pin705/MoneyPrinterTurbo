import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ApiError } from "@mpt/api-client";
import { TaskState, type VideoParams } from "@mpt/shared";
import { toast } from "sonner";

import { useApi } from "@/lib/useApi";

export function useVideoTask() {
  const { t } = useTranslation();
  const api = useApi();
  const [taskId, setTaskId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (params: VideoParams) => api.createVideoTask(params),
    onSuccess: (data) => setTaskId(data.task_id),
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : String(e);
      toast.error(t("Could not start generation"), { description: msg });
    },
  });

  const task = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.getTask(taskId!),
    enabled: !!taskId,
    refetchInterval: (q) => {
      const state = q.state.data?.state;
      if (state === TaskState.COMPLETE || state === TaskState.FAILED) {
        return false;
      }
      return 1500;
    },
  });

  const reset = () => setTaskId(null);

  const isRunning =
    create.isPending ||
    (!!taskId &&
      task.data?.state !== TaskState.COMPLETE &&
      task.data?.state !== TaskState.FAILED);

  return { api, taskId, create, task, reset, isRunning };
}
