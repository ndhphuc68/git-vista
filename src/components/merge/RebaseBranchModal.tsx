import React, { useState, useEffect } from "react";
import { X, GitCommit, AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface RebaseBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: string;
  upstreamBranch: string;
  hasUncommittedChanges: boolean;
  onRebase: () => Promise<{ success: boolean; status: string; output: string }>;
}

export const RebaseBranchModal: React.FC<RebaseBranchModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  upstreamBranch,
  hasUncommittedChanges,
  onRebase,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRebaseSubmit = async () => {
    if (hasUncommittedChanges) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onRebase();
      if (res.success) {
        onClose();
      } else {
        if (res.status === "Conflict") {
          setError(t.modals.rebase.conflictError);
        } else {
          setError(res.output || t.modals.rebase.genericError.replace("{msg}", res.status));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(t.modals.rebase.genericError.replace("{msg}", msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rebase-branch-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <GitCommit size={16} className="text-accent" />
            <h3
              id="rebase-branch-title"
              className="text-xs font-semibold text-primary m-0"
            >
              {t.modals.rebase.title}
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

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-primary bg-window p-2.5 rounded-sm border border-border-subtle">
            <span className="font-semibold text-primary">{currentBranch}</span>
            <ArrowRight size={13} className="text-secondary shrink-0" />
            <span className="font-semibold text-accent">{upstreamBranch}</span>
          </div>

          <p className="text-xs text-secondary leading-normal m-0">
            {t.modals.rebase.desc}
          </p>

          {hasUncommittedChanges && (
            <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{t.modals.rebase.uncommittedWarn}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t.modals.rebase.cancel}
          </button>
          <button
            type="button"
            aria-label={t.modals.rebase.submit}
            onClick={handleRebaseSubmit}
            disabled={loading || hasUncommittedChanges}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <GitCommit size={13} />
            <span>{loading ? t.modals.rebase.rebasing : t.modals.rebase.submit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
