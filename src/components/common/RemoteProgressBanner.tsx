import React from "react";
import { useTranslation } from "../../i18n";

export interface RemoteTaskState {
  taskId: string;
  title: string;
  statusText: string;
  progressPercent: number;
}

export interface RemoteProgressBannerProps {
  task: RemoteTaskState | null;
  onCancel?: (taskId: string) => void;
}

export const RemoteProgressBanner: React.FC<RemoteProgressBannerProps> = ({
  task,
  onCancel,
}) => {
  const { t } = useTranslation();
  if (!task) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-md transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <h4 className="text-xs font-semibold text-zinc-100 truncate">
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono font-medium text-blue-400">
            {task.progressPercent}%
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(task.taskId)}
              className="px-2 py-0.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/60 rounded transition focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label={t.remoteProgress.cancelTaskAria}
            >
              {t.remoteProgress.cancelTask}
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
        <p className="mt-1.5 text-[11px] text-zinc-400 truncate font-mono">
          {task.statusText}
        </p>
      )}
    </div>
  );
};
