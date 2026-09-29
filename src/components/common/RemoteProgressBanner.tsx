import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import type { FriendlyError } from "../../utils/errorMapping";
import type { RemoteOperation } from "../../features/remote/api";
import { RemoteProgressError } from "./RemoteProgressError";
import { RemoteProgressActive } from "./RemoteProgressActive";

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

  if (error) {
    return (
      <RemoteProgressError
        t={t}
        task={task}
        error={error}
        running={running}
        onCancel={onCancel}
        onRetry={onRetry}
        onDismiss={onDismiss}
        copyResult={copyResult}
        onCopyDetails={() => void copyDetails()}
      />
    );
  }

  return <RemoteProgressActive t={t} task={task} running={running} onCancel={onCancel} />;
};
