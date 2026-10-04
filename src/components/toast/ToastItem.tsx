import React from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { type ToastItem as ToastItemType } from "../../store/useToastStore";
import { useTranslation } from "../../i18n";
import { useToastItem } from "./useToastItem";
import { TOAST_ICONS, TOAST_ACCENT_CLASS } from "./toastVariants";
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
      className="relative flex flex-col bg-surface/95 backdrop-blur-md border border-border-subtle text-primary rounded-xl shadow-2xl shadow-black/50 overflow-hidden transition-all text-sm w-full animate-slide-up"
    >
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1", TOAST_ACCENT_CLASS[toast.type])} />

      <div className="flex items-start gap-3 p-3.5 pl-4 sm:p-4 sm:pl-4.5">
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
          className="shrink-0 text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-hover text-sm leading-none cursor-pointer"
        >
          <X className="w-4 h-4" />
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
