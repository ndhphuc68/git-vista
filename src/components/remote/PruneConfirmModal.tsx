import React, { useState, useEffect } from "react";
import { Scissors, X, ShieldCheck, AlertCircle, Loader2, Cloud } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Transition } from "../common/Transition";

export interface PruneConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  remoteName: string;
  onSuccess?: (prunedBranches: string[]) => void;
}

export const PruneConfirmModal: React.FC<PruneConfirmModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  remoteName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen, remoteName]);

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

  const handlePrune = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await invokeCommand.pruneRemote(repoPath, remoteName);
      if (res.pruned_branches.length > 0) {
        useToastStore
          .getState()
          .showSuccess(
            t.modals.remotes.pruneModal.successToast.replace(
              "{count}",
              String(res.pruned_branches.length)
            )
          );
      } else {
        useToastStore.getState().showToast({
          type: "info",
          message: t.modals.remotes.pruneModal.nonePrunedToast,
        });
      }

      onSuccess?.(res.pruned_branches);
      onClose();
    } catch (err) {
      setError(mapGitError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} duration={150}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prune-remote-title"
      >
        <div
          className="relative w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-sky-500/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                <Scissors size={18} />
              </div>
              <h3 id="prune-remote-title" className="text-sm font-semibold text-primary m-0">
                {t.modals.remotes.pruneModal.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
              aria-label={t.common.close}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <p className="text-xs text-secondary m-0 leading-relaxed">
              {t.modals.remotes.pruneModal.confirmMessage}
            </p>

            {/* Target Remote */}
            <div className="p-3 bg-window border border-border-subtle rounded-lg flex items-center gap-2.5">
              <Cloud size={16} className="text-sky-500 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">Máy chủ:</span>
                <span className="text-xs font-mono font-semibold text-primary px-1.5 py-0.5 rounded bg-surface border border-border-subtle">
                  {remoteName}
                </span>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
              <ShieldCheck size={15} className="shrink-0 mt-0.5" />
              <span>{t.modals.remotes.pruneModal.safeNotice}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-transparent text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handlePrune}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {loading
                    ? t.modals.remotes.pruneModal.pruning
                    : t.modals.remotes.pruneModal.confirmBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
