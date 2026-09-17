import React, { useState, useEffect } from "react";
import { GitPullRequest, X, AlertCircle, Loader2, GitBranch } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import type { CommitActionResult } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Transition } from "../common/Transition";

export interface CherryPickModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommit: {
    id: string;
    short_id: string;
    summary: string;
    author: string;
    time?: string;
  };
  currentBranch?: string;
  onSuccess?: (result: CommitActionResult) => void;
}

export const CherryPickModal: React.FC<CherryPickModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  currentBranch,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [autoCommit, setAutoCommit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAutoCommit(true);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await invokeCommand.cherryPickCommit(
        repoPath,
        targetCommit.id,
        autoCommit
      );

      if (res.success || res.status === "Conflict") {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg =
          res.output ||
          t.modals.cherryPick.genericError.replace("{msg}", res.status);
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition
      show={isOpen}
      className="fixed inset-0 z-[9999]"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cherry-pick-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <GitPullRequest size={16} className="text-accent" />
              <h3
                id="cherry-pick-title"
                className="text-xs font-semibold text-primary m-0"
              >
                {t.modals.cherryPick.title}
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

          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            {/* Target commit info card */}
            <div className="bg-window px-3 py-2.5 rounded-md border border-border-subtle flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-secondary text-[11px] font-medium">
                  {t.modals.cherryPick.targetCommit}
                </span>
                <span className="font-mono text-primary font-semibold text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                  {targetCommit.short_id || targetCommit.id.substring(0, 7)}
                </span>
              </div>
              <div
                className="font-medium text-primary line-clamp-2"
                title={targetCommit.summary}
              >
                {targetCommit.summary}
              </div>
              <div className="flex items-center justify-between text-[11px] text-tertiary">
                <span>{targetCommit.author}</span>
                {targetCommit.time && <span>{targetCommit.time}</span>}
              </div>
            </div>

            {/* Destination Branch */}
            {currentBranch && (
              <div className="flex items-center justify-between text-xs bg-window px-3 py-2 rounded-md border border-border-subtle">
                <span className="text-secondary text-[11px]">
                  {t.modals.cherryPick.destinationBranch}
                </span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <GitBranch size={13} className="text-accent" />
                  {currentBranch}
                </span>
              </div>
            )}

            {/* Auto-commit checkbox */}
            <div className="flex flex-col gap-1 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
                <input
                  type="checkbox"
                  checked={autoCommit}
                  onChange={(e) => setAutoCommit(e.target.checked)}
                  disabled={loading}
                  aria-label={t.modals.cherryPick.autoCommitLabel}
                  className="accent-accent cursor-pointer rounded-sm"
                />
                <span className="font-medium">
                  {t.modals.cherryPick.autoCommitLabel}
                </span>
              </label>
              <span className="text-[11px] text-secondary pl-6">
                {t.modals.cherryPick.autoCommitDesc}
              </span>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-1.5 p-2 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {t.modals.cherryPick.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t.modals.cherryPick.submitting}</span>
                  </>
                ) : (
                  <span>{t.modals.cherryPick.submit}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  );
};
