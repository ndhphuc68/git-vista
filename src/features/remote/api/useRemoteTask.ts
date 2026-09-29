import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invokeCommand, listenToTaskProgress } from "../../../ipc/client";
import { useTranslation } from "../../../i18n";
import type { RemoteTaskState } from "../../../components/common/RemoteProgressBanner";
import {
  createCancelRemoteTask,
  createRunRemoteTask,
  type RemoteOperation,
  type TaskOwner,
} from "./useRemoteTask.actions";

export type { RemoteOperation };

export function useRemoteTask(repoPath: string | undefined, hasUpstream: boolean) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [task, setTask] = useState<RemoteTaskState | null>(null);
  const active = useRef<TaskOwner | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    active.current = null;
    setTask(null);
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void listenToTaskProgress((payload) => {
      if (disposed || active.current?.taskId !== payload.task_id || !active.current.pending) return;
      setTask((previous) =>
        previous?.taskId === payload.task_id
          ? {
              ...previous,
              progressPercent: payload.progress_percent,
              statusText: active.current?.cancelling ? previous.statusText : payload.status_text,
            }
          : previous
      );
    })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((error) => {
        // Progress is optional: command completion still supplies the final result.
        console.error("Remote progress listener failed", error);
      });
    return () => {
      disposed = true;
      active.current = null;
      clearTimeout(clearTimer.current);
      unlisten?.();
    };
  }, [repoPath]);

  const clearCompletedTask = (owner: TaskOwner) => {
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      if (active.current === owner && !owner.cancelPending) {
        setTask((previous) =>
          previous?.taskId === owner.taskId &&
          previous.status === "success" &&
          !previous.cancelError
            ? null
            : previous
        );
      }
    }, 1000);
  };

  const context = {
    repoPath,
    hasUpstream,
    t,
    queryClient,
    active,
    clearTimer,
    setTask,
    clearCompletedTask,
  };
  const run = createRunRemoteTask(context);
  const cancel = createCancelRemoteTask(context);

  return {
    task,
    isPending: task?.status === "running",
    run,
    cancel,
    retry: () => {
      if (task?.operation && task.status === "error") void run(task.operation);
    },
    dismiss: () => {
      if (!active.current?.pending) {
        clearTimeout(clearTimer.current);
        setTask(null);
      }
    },
  };
}

/**
 * Pushes `branch` (current branch if omitted) to `remote` (default remote if
 * omitted). `src/ipc/remote.ts` takes `force` and `taskId` as two trailing
 * positional parameters; they are grouped into `options` here so this
 * wrapper stays within the repo's `max-params: 5` lint rule (`src/ipc/**`
 * is exempted from that rule, a feature's `api/` directory is not) while
 * still forwarding both values unchanged.
 */
export function pushRepo(
  repoPath: string,
  remote?: string,
  branch?: string,
  setUpstream?: boolean,
  options?: { force?: boolean; taskId?: string }
): Promise<string> {
  return invokeCommand.pushRepo(
    repoPath,
    remote,
    branch,
    setUpstream,
    options?.force,
    options?.taskId
  );
}
