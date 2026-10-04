import React from "react";
import { type ToastItem as ToastItemType } from "../../store/useToastStore";
import { useTranslation } from "../../i18n";

export interface ToastBodyProps {
  toast: ToastItemType;
  rawError: string | undefined;
  actionHint: string | undefined;
  showDetails: boolean;
  setShowDetails: (updater: (prev: boolean) => boolean) => void;
  isUndoing: boolean;
  onUndo: () => void;
}

export const ToastBody: React.FC<ToastBodyProps> = ({
  toast,
  rawError,
  actionHint,
  showDetails,
  setShowDetails,
  isUndoing,
  onUndo,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 min-w-0 pr-1">
      {toast.title && (
        <h4 className="font-semibold text-primary text-sm mb-0.5 leading-snug tracking-tight">
          {toast.title}
        </h4>
      )}
      <p className="text-xs sm:text-sm text-secondary whitespace-pre-wrap break-words leading-relaxed">
        {toast.message}
      </p>

      {actionHint && (
        <div className="mt-2 text-xs bg-amber-950/40 text-amber-300/90 border border-amber-800/40 p-2 rounded-md leading-relaxed">
          {actionHint}
        </div>
      )}

      {rawError && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="text-xs text-secondary hover:text-primary underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            {t.toast.technicalDetails} {showDetails ? "▲" : "▼"}
          </button>
          {showDetails && (
            <pre className="mt-1.5 p-2 bg-window text-diff-remove-text font-mono text-xs rounded-md border border-border-subtle overflow-x-auto max-h-36 whitespace-pre-wrap break-all select-text">
              {rawError}
            </pre>
          )}
        </div>
      )}

      {toast.undoAction && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={isUndoing}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-md transition-colors cursor-pointer shadow-xs"
          >
            {isUndoing ? t.toast.undoing : toast.undoLabel || t.toast.undo}
          </button>
        </div>
      )}
    </div>
  );
};
