import React, { useState, useEffect } from "react";
import { Trash2, X, AlertTriangle, AlertCircle, Loader2, Tag } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Transition } from "../common/Transition";

export interface DeleteTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  tagName: string;
  targetCommitId?: string;
  hasRemote?: boolean;
  onSuccess?: () => void;
}

export const DeleteTagModal: React.FC<DeleteTagModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  tagName,
  targetCommitId,
  hasRemote = false,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [deleteRemote, setDeleteRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeleteRemote(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, tagName]);

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

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await invokeCommand.deleteTag(repoPath, tagName, deleteRemote);
      useToastStore.getState().showToast({
        message: t.modals.deleteTag.successToast.replace("{name}", tagName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(t.modals.deleteTag.errorGeneric.replace("{msg}", msg));
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
        aria-labelledby="delete-tag-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-diff-remove-text" />
              <h3
                id="delete-tag-title"
                className="text-xs font-semibold text-primary m-0"
              >
                {t.modals.deleteTag.title}
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
            <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs leading-normal">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{t.modals.deleteTag.confirmMessage}</span>
            </div>

            <div className="flex flex-col gap-1 px-3 py-2 bg-window rounded-sm border border-border-subtle">
              <div className="font-mono text-xs text-primary font-semibold break-all flex items-center gap-2">
                <Tag size={14} className="text-accent shrink-0" />
                <span>{tagName}</span>
              </div>
              {targetCommitId && (
                <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                  <span>{t.modals.deleteTag.targetCommit}</span>
                  <span className="font-mono text-primary font-semibold">
                    {targetCommitId.substring(0, 7)}
                  </span>
                </div>
              )}
            </div>

            {hasRemote && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
                <input
                  type="checkbox"
                  checked={deleteRemote}
                  onChange={(e) => setDeleteRemote(e.target.checked)}
                  disabled={loading}
                  aria-label={t.modals.deleteTag.deleteRemoteLabel}
                  className="accent-accent cursor-pointer rounded-sm"
                />
                <span>{t.modals.deleteTag.deleteRemoteLabel}</span>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-1.5 p-2 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {t.modals.deleteTag.cancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-diff-remove-text text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{t.modals.deleteTag.deleting}</span>
                </>
              ) : (
                <span>{t.modals.deleteTag.submit}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
};
