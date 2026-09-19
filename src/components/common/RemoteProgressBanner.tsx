import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import type { FriendlyError } from "../../utils/errorMapping";
import type { RemoteOperation } from "../../features/remote/api";

export interface RemoteTaskState {
  taskId: string;
  title: string;
  statusText: string;
  progressPercent: number;
  operation?: RemoteOperation;
  status?: "running" | "success" | "error";
  cancelling?: boolean;
  error?: FriendlyError;
  cancelError?: FriendlyError;
}

export interface RemoteProgressBannerProps {
  task: RemoteTaskState | null;
  onCancel?: (taskId: string) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const RemoteProgressBanner: React.FC<RemoteProgressBannerProps> = ({
  task,
  onCancel,
  onRetry,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [copyResult, setCopyResult] = useState<{
    taskId: string;
    status: "copied" | "copyFailed";
  } | null>(null);
  if (!task) return null;
  const running = !task.status || task.status === "running";
  const error = task.error ?? task.cancelError;
  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(error?.rawError ?? error?.message ?? "");
      setCopyResult({ taskId: task.taskId, status: "copied" });
    } catch {
      setCopyResult({ taskId: task.taskId, status: "copyFailed" });
    }
  };
  const actionClass =
    "rounded border border-border-subtle px-2 py-1 text-xs text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";

  if (error)
    return (
      <section className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-diff-del-border bg-surface p-4 shadow-2xl">
        <div role="alert">
          <p className="text-xs font-medium text-secondary">{task.title}</p>
          <h4 className="mt-1 text-sm font-semibold text-diff-del-text">
            {task.error ? error.title : t.remoteProgress.cancelFailed}
          </h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-xs text-primary">
            {error.message}
          </p>
          <p className="mt-2 text-xs text-secondary">
            {error.actionHint ?? t.remoteProgress.genericHint}
          </p>
          {running && (
            <p className="mt-2 text-xs text-secondary">{t.remoteProgress.stillRunning}</p>
          )}
        </div>
        <details className="mt-3 text-xs text-secondary">
          <summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-accent">
            {t.remoteProgress.technicalDetails}
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all select-text">
            {error.rawError ?? error.message}
          </pre>
        </details>
        <div className="mt-3 flex flex-wrap gap-2">
          {task.status === "error" && onRetry && (
            <button type="button" className={actionClass} onClick={onRetry}>
              {t.remoteProgress.retry}
            </button>
          )}
          {running && onCancel && (
            <button
              type="button"
              className={actionClass}
              disabled={task.cancelling}
              onClick={() => onCancel(task.taskId)}
              aria-label={t.remoteProgress.cancelTaskAria}
            >
              {task.cancelling ? t.remoteProgress.cancelling : t.remoteProgress.cancelTask}
            </button>
          )}
          <button type="button" className={actionClass} onClick={() => void copyDetails()}>
            {t.remoteProgress.copyDetails}
          </button>
          {!running && onDismiss && (
            <button type="button" className={actionClass} onClick={onDismiss}>
              {t.remoteProgress.dismiss}
            </button>
          )}
        </div>
        {copyResult?.taskId === task.taskId && (
          <p role="status" className="mt-2 text-xs text-secondary">
            {t.remoteProgress[copyResult.status]}
          </p>
        )}
      </section>
    );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-md transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5">
            {running && (
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <h4 className="text-xs font-semibold text-zinc-100 truncate">{task.title}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono font-medium text-blue-400">
            {task.progressPercent}%
          </span>
          {onCancel && running && (
            <button
              type="button"
              onClick={() => onCancel(task.taskId)}
              disabled={task.cancelling}
              className="px-2 py-0.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/60 rounded transition focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label={t.remoteProgress.cancelTaskAria}
            >
              {task.cancelling ? t.remoteProgress.cancelling : t.remoteProgress.cancelTask}
            </button>
          )}
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={task.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, task.progressPercent))}%` }}
        />
      </div>

      {task.statusText && (
        <p className="mt-1.5 text-[11px] text-zinc-400 truncate font-mono">{task.statusText}</p>
      )}
    </div>
  );
};
