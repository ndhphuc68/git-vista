import React from "react";
import type { FriendlyError } from "../../utils/errorMapping";
import type { useTranslation } from "../../i18n";
import type { RemoteTaskState } from "./RemoteProgressBanner";

const ACTION_CLASS =
  "rounded border border-border-subtle px-2 py-1 text-xs text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";

export interface RemoteProgressErrorProps {
  t: ReturnType<typeof useTranslation>["t"];
  task: RemoteTaskState;
  error: FriendlyError;
  running: boolean;
  onCancel?: (taskId: string) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  copyResult: { taskId: string; status: "copied" | "copyFailed" } | null;
  onCopyDetails: () => void;
}

export const RemoteProgressError: React.FC<RemoteProgressErrorProps> = ({
  t,
  task,
  error,
  running,
  onCancel,
  onRetry,
  onDismiss,
  copyResult,
  onCopyDetails,
}) => (
  <section className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-diff-del-border bg-surface p-4 shadow-2xl">
    <div role="alert">
      <p className="text-xs font-medium text-secondary">{task.title}</p>
      <h4 className="mt-1 text-sm font-semibold text-diff-del-text">
        {task.error ? error.title : t.remoteProgress.cancelFailed}
      </h4>
      <p className="mt-2 whitespace-pre-wrap break-words text-xs text-primary">{error.message}</p>
      <p className="mt-2 text-xs text-secondary">
        {error.actionHint ?? t.remoteProgress.genericHint}
      </p>
      {running && <p className="mt-2 text-xs text-secondary">{t.remoteProgress.stillRunning}</p>}
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
        <button type="button" className={ACTION_CLASS} onClick={onRetry}>
          {t.remoteProgress.retry}
        </button>
      )}
      {running && onCancel && (
        <button
          type="button"
          className={ACTION_CLASS}
          disabled={task.cancelling}
          onClick={() => onCancel(task.taskId)}
          aria-label={t.remoteProgress.cancelTaskAria}
        >
          {task.cancelling ? t.remoteProgress.cancelling : t.remoteProgress.cancelTask}
        </button>
      )}
      <button type="button" className={ACTION_CLASS} onClick={onCopyDetails}>
        {t.remoteProgress.copyDetails}
      </button>
      {!running && onDismiss && (
        <button type="button" className={ACTION_CLASS} onClick={onDismiss}>
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
