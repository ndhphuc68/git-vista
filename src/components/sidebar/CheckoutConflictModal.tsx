import React, { useState, useEffect } from "react";
import { AlertTriangle, X, ArrowRight, Archive } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";

export interface CheckoutConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBranch: string;
  errorMessage: string;
  onNavigateToChanges: () => void;
  repoPath?: string;
  onSuccess?: () => void;
}

export const CheckoutConflictModal: React.FC<CheckoutConflictModalProps> = ({
  isOpen,
  onClose,
  targetBranch,
  errorMessage,
  onNavigateToChanges,
  repoPath,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [isStashing, setIsStashing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsStashing(false);
      setActionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStashAndCheckout = async () => {
    if (!repoPath) return;
    setIsStashing(true);
    setActionError(null);
    try {
      await invokeCommand.saveStash(
        repoPath,
        t.modals.checkoutConflict.autoStashMessage.replace("{target}", targetBranch),
        true
      );
      await invokeCommand.checkoutBranch(repoPath, targetBranch);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(t.modals.checkoutConflict.stashError.replace("{msg}", msg));
    } finally {
      setIsStashing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-conflict-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-120 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-diff-remove-text" />
            <h3 id="checkout-conflict-title" className="text-xs font-semibold text-primary m-0">
              {t.modals.checkoutConflict.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-sm transition-colors"
            aria-label={t.common.close}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-primary leading-normal m-0">
            {t.modals.checkoutConflict.description.split("{target}")[0]}
            <strong className="font-semibold">{targetBranch}</strong>
            {t.modals.checkoutConflict.description.split("{target}")[1]}
          </p>

          <div className="p-3 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs font-mono break-all leading-relaxed max-h-40 overflow-y-auto">
            {errorMessage.replace("CHECKOUT_CONFLICT: ", "")}
          </div>

          {actionError && (
            <div className="p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              {actionError}
            </div>
          )}

          <p className="text-[11px] text-secondary leading-normal m-0">
            {t.modals.checkoutConflict.advice}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={isStashing}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t.modals.checkoutConflict.close}
          </button>
          {repoPath && (
            <button
              type="button"
              onClick={handleStashAndCheckout}
              disabled={isStashing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-border-subtle text-primary rounded-sm text-xs font-semibold cursor-pointer hover:bg-border-subtle active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Archive size={13} className="text-accent" />
              <span>
                {isStashing
                  ? t.modals.checkoutConflict.stashingAndCheckout
                  : t.modals.checkoutConflict.stashAndCheckout}
              </span>
            </button>
          )}
          <button
            type="button"
            disabled={isStashing}
            onClick={() => {
              onClose();
              onNavigateToChanges();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{t.modals.checkoutConflict.toChanges}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
