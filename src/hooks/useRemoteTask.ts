import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invokeCommand, listenToTaskProgress } from "../ipc/client";
import { useTranslation } from "../i18n";
import type { RemoteTaskState } from "../components/common/RemoteProgressBanner";
import { mapGitError } from "../utils/errorMapping";
import { qk } from "../domain/queryKeys";

export type RemoteOperation = "fetch" | "pull" | "push";
interface TaskOwner {
  taskId: string;
  pending: boolean;
  cancelling: boolean;
  cancelPending: boolean;
}

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

  const run = async (operation: RemoteOperation) => {
    if (!repoPath || active.current?.pending) return;
    clearTimeout(clearTimer.current);
    const taskId = `task-${operation}-${crypto.randomUUID()}`;
    const owner = { taskId, pending: true, cancelling: false, cancelPending: false };
    active.current = owner;
    setTask({
      taskId,
      operation,
      title: t.remoteProgress[`${operation}Title`],
      statusText: t.remoteProgress.starting,
      progressPercent: 0,
      status: "running",
    });
    try {
      if (operation === "fetch") await invokeCommand.fetchRepo(repoPath, undefined, false, taskId);
      else if (operation === "pull")
        await invokeCommand.pullRepo(repoPath, undefined, undefined, undefined, taskId);
      else
        await invokeCommand.pushRepo(repoPath, undefined, undefined, !hasUpstream, false, taskId);
      if (active.current !== owner) return;
      void queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
      setTask((previous) =>
        previous?.taskId === taskId
          ? {
              ...previous,
              status: "success",
              statusText: t.remoteProgress.completed,
              progressPercent: 100,
            }
          : previous
      );
      clearCompletedTask(owner);
    } catch (error) {
      if (active.current !== owner) return;
      setTask((previous) =>
        previous?.taskId === taskId
          ? { ...previous, status: "error", error: mapGitError(error, t) }
          : previous
      );
      // Pull may leave conflicts even when it fails; refresh the affected views.
      void queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
    } finally {
      owner.pending = false;
      if (active.current === owner)
        setTask((previous) =>
          previous?.taskId === taskId ? { ...previous, cancelling: false } : previous
        );
    }
  };

  const cancel = async (taskId: string) => {
    const owner = active.current;
    if (!owner || owner.taskId !== taskId || !owner.pending || owner.cancelling) return;
    owner.cancelling = true;
    owner.cancelPending = true;
    setTask((previous) =>
      previous?.taskId === taskId
        ? {
            ...previous,
            cancelling: true,
            cancelError: undefined,
            statusText: t.remoteProgress.cancelling,
          }
        : previous
    );
    try {
      await invokeCommand.cancelRemoteTask(taskId);
      // Cancellation acknowledges the request; only command settlement releases busy.
    } catch (error) {
      owner.cancelling = false;
      if (active.current !== owner) return;
      clearTimeout(clearTimer.current);
      setTask((previous) =>
        previous?.taskId === taskId
          ? { ...previous, cancelling: false, cancelError: mapGitError(error, t) }
          : previous
      );
    } finally {
      owner.cancelPending = false;
      if (active.current === owner && !owner.pending) clearCompletedTask(owner);
    }
  };

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
