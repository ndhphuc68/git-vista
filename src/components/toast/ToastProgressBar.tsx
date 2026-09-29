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
    <div className="w-full bg-slate-800 h-1 overflow-hidden">
      <div
        className={clsx("h-full origin-left", TOAST_PROGRESS_CLASS[toast.type])}
        style={{
          animation: `toast-progress ${toast.durationMs}ms linear forwards`,
        }}
      />
    </div>
  );
};
