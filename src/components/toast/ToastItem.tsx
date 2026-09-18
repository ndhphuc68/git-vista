import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";
import { type ToastItem as ToastItemType, useToastStore } from "../../store/useToastStore";
import { useTranslation } from "../../i18n";

export interface ToastItemProps {
  toast: ToastItemType;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { t } = useTranslation();
  const [isUndoing, setIsUndoing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (!toast.durationMs || toast.durationMs <= 0) return;

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, toast.durationMs, removeToast]);

  const handleUndo = async () => {
    if (isUndoing || !toast.undoAction) return;
    setIsUndoing(true);
    try {
      await toast.undoAction();
    } catch (err) {
      console.error("Undo action failed:", err);
    } finally {
      removeToast(toast.id);
    }
  };

  const rawError = toast.rawError || toast.friendlyError?.rawError;
  const actionHint = toast.friendlyError?.actionHint;

  return (
    <div
      role="alert"
      className="relative flex flex-col bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg shadow-xl overflow-hidden transition-all text-sm w-full"
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <div className="shrink-0 mt-0.5">
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <h4 className="font-semibold text-slate-100 text-sm mb-0.5 leading-snug">
              {toast.title}
            </h4>
          )}
          <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
            {toast.message}
          </p>

          {actionHint && (
            <div className="mt-2 text-xs bg-amber-950/40 text-amber-300/90 border border-amber-800/40 p-2 rounded leading-relaxed">
              {actionHint}
            </div>
          )}

          {rawError && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="text-xs text-slate-400 hover:text-slate-200 underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                {t.toast.technicalDetails} {showDetails ? "▲" : "▼"}
              </button>
              {showDetails && (
                <pre className="mt-1.5 p-2 bg-slate-950 text-rose-300 font-mono text-[11px] rounded border border-slate-800 overflow-x-auto max-h-36 whitespace-pre-wrap break-all select-text">
                  {rawError}
                </pre>
              )}
            </div>
          )}

          {toast.undoAction && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={isUndoing}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded transition-colors cursor-pointer"
              >
                {isUndoing ? t.toast.undoing : toast.undoLabel || t.toast.undo}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          aria-label={t.toast.close || t.common.close}
          className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800 text-sm leading-none cursor-pointer"
        >
          ✕
        </button>
      </div>

      {toast.durationMs && toast.durationMs > 0 && (
        <div className="w-full bg-slate-800 h-1 overflow-hidden">
          <div
            className={clsx(
              "h-full origin-left",
              toast.type === "success" && "bg-emerald-500",
              toast.type === "error" && "bg-rose-500",
              toast.type === "info" && "bg-sky-500"
            )}
            style={{
              animation: `toast-progress ${toast.durationMs}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
