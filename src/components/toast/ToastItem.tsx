import React from "react";
import { type ToastItem as ToastItemType } from "../../store/useToastStore";
import { useTranslation } from "../../i18n";
import { useToastItem } from "./useToastItem";
import { TOAST_ICONS } from "./toastVariants";
import { ToastBody } from "./ToastBody";
import { ToastProgressBar } from "./ToastProgressBar";

export interface ToastItemProps {
  toast: ToastItemType;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { t } = useTranslation();
  const { isUndoing, showDetails, setShowDetails, handleUndo, handleClose, rawError, actionHint } =
    useToastItem(toast);

  return (
    <div
      role="alert"
      className="relative flex flex-col bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg shadow-xl overflow-hidden transition-all text-sm w-full"
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <div className="shrink-0 mt-0.5">{TOAST_ICONS[toast.type]}</div>

        <ToastBody
          toast={toast}
          rawError={rawError}
          actionHint={actionHint}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          isUndoing={isUndoing}
          onUndo={() => void handleUndo()}
        />

        <button
          type="button"
          onClick={handleClose}
          aria-label={t.toast.close || t.common.close}
          className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800 text-sm leading-none cursor-pointer"
        >
          ✕
        </button>
      </div>

      <ToastProgressBar toast={toast} />

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
