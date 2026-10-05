import React from "react";
import clsx from "clsx";
import { type ToastItem as ToastItemType } from "../../store/useToastStore";
import { TOAST_PROGRESS_CLASS } from "./toastVariants";

export interface ToastProgressBarProps {
  toast: ToastItemType;
}

export const ToastProgressBar: React.FC<ToastProgressBarProps> = ({ toast }) => {
  if (!toast.durationMs || toast.durationMs <= 0) return null;

  return (
    <div className="px-4 pb-2 pt-0.5">
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full origin-left rounded-full shadow-xs",
            TOAST_PROGRESS_CLASS[toast.type]
          )}
          style={{
            animation: `toast-progress ${toast.durationMs}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};
