import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface DiscardConfirmModalProps {
  isOpen: boolean;
  filePath: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardConfirmModal: React.FC<DiscardConfirmModalProps> = ({
  isOpen,
  filePath,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !filePath) return null;

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-[9999] p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-modal-title"
    >
      <div
        className="bg-surface rounded-xl border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-diff-remove-text" />
            <h3 id="discard-modal-title" className="text-xs font-semibold text-primary m-0">
              {t.discard.title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-sm transition-colors"
            aria-label={t.common.close}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-primary leading-normal m-0">{t.discard.description}</p>

          <div className="px-3 py-2 bg-window rounded-sm border border-border-subtle font-mono text-xs text-primary break-all">
            {filePath}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface">
          <button
            type="button"
            data-testid="cancel-discard-button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors"
          >
            {t.discard.cancel}
          </button>

          <button
            type="button"
            data-testid="confirm-discard-button"
            onClick={onConfirm}
            className="px-3 py-1.5 bg-diff-remove-text border-none rounded-sm text-xs font-semibold text-white cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {t.discard.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
