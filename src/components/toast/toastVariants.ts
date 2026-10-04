import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { ToastItem as ToastItemType } from "../../store/useToastStore";

type ToastType = ToastItemType["type"];

/** Icon shown at the start of the toast, keyed by toast type. */
export const TOAST_ICONS: Record<ToastType, React.ReactElement> = {
  success: React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-400" }),
  error: React.createElement(AlertCircle, { className: "w-5 h-5 text-rose-400" }),
  info: React.createElement(Info, { className: "w-5 h-5 text-sky-400" }),
};

/** Progress-bar fill color, keyed by toast type. */
export const TOAST_PROGRESS_CLASS: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  info: "bg-sky-500",
};

/** Left-edge accent indicator color, keyed by toast type. */
export const TOAST_ACCENT_CLASS: Record<ToastType, string> = {
  success: "bg-emerald-400",
  error: "bg-rose-400",
  info: "bg-sky-400",
};
