import React, { useState, useEffect } from "react";
import { X, GitMerge, AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface MergeBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: string;
  targetBranch: string;
  hasUncommittedChanges: boolean;
  onMerge: (noFf: boolean) => Promise<{ success: boolean; status: string; output: string }>;
}

export const MergeBranchModal: React.FC<MergeBranchModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  targetBranch,
  hasUncommittedChanges,
  onMerge,
}) => {
  const { t } = useTranslation();
  const [noFf, setNoFf] = useState(false);
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
      setNoFf(false);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMergeSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onMerge(noFf);
      if (res.success) {
        onClose();
      } else {
        if (res.status === "Conflict") {
          setError(t.modals.merge.conflictError);
        } else {
          setError(res.output || t.modals.merge.genericError.replace("{msg}", res.status));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(t.modals.merge.genericError.replace("{msg}", msg));
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
      aria-labelledby="merge-branch-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <GitMerge size={16} className="text-accent" />
            <h3
              id="merge-branch-title"
              className="text-xs font-semibold text-primary m-0"
            >
              {t.modals.merge.title}
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
            <span className="font-semibold text-accent">{targetBranch}</span>
            <ArrowRight size={13} className="text-secondary shrink-0" />
            <span className="font-semibold text-primary">{currentBranch}</span>
          </div>

          <p className="text-xs text-secondary leading-normal m-0">
            {t.modals.merge.desc}
          </p>

          {hasUncommittedChanges && (
            <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{t.modals.merge.uncommittedWarn}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <input
              id="merge-no-ff"
              type="checkbox"
              checked={noFf}
              onChange={(e) => setNoFf(e.target.checked)}
              disabled={loading}
              className="w-3 h-3 accent-accent cursor-pointer"
            />
            <label
              htmlFor="merge-no-ff"
              className="text-xs text-primary cursor-pointer select-none"
            >
              {t.modals.merge.noFfLabel}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t.modals.merge.cancel}
          </button>
          <button
            type="button"
            aria-label={t.modals.merge.submit}
            onClick={handleMergeSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <GitMerge size={13} />
            <span>{loading ? t.modals.merge.merging : t.modals.merge.submit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
