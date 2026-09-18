import React, { useState, useEffect, useRef } from "react";
import { Tag, X, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Transition } from "../common/Transition";

export interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommitId: string;
  targetCommitSummary?: string | null;
  onSuccess?: () => void;
}

export const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommitId,
  targetCommitSummary,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [isAnnotated, setIsAnnotated] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsAnnotated(false);
      setMessage("");
      setError(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const sanitizeTagName = (val: string) => {
    return val.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTagName(e.target.value);
    setName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.modals.createTag.errorEmpty);
      return;
    }

    if (isAnnotated && !message.trim()) {
      setError(t.modals.createTag.errorEmptyMessage);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await invokeCommand.createTag(
        repoPath,
        trimmedName,
        targetCommitId,
        isAnnotated ? message : undefined
      );
      useToastStore.getState().showToast({
        message: t.modals.createTag.successToast.replace("{name}", trimmedName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
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
        aria-labelledby="create-tag-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-accent" />
              <h3 id="create-tag-title" className="text-xs font-semibold text-primary m-0">
                {t.modals.createTag.title}
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
            {targetCommitId && (
              <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
                <span>{t.modals.createTag.targetCommit}</span>
                <span className="font-mono text-primary font-semibold">
                  {targetCommitId.substring(0, 7)}
                </span>
                {targetCommitSummary && (
                  <span
                    className="truncate text-secondary ml-1 max-w-[200px]"
                    title={targetCommitSummary}
                  >
                    - {targetCommitSummary}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tag-name-input" className="text-xs font-medium text-primary">
                {t.modals.createTag.nameLabel}
              </label>
              <input
                ref={inputRef}
                id="tag-name-input"
                aria-label={t.modals.createTag.nameLabel}
                type="text"
                placeholder={t.modals.createTag.namePlaceholder}
                value={name}
                onChange={handleNameChange}
                disabled={loading}
                className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
              <input
                type="checkbox"
                checked={isAnnotated}
                onChange={(e) => setIsAnnotated(e.target.checked)}
                disabled={loading}
                aria-label={t.modals.createTag.annotatedLabel}
                className="accent-accent cursor-pointer rounded-sm"
              />
              <span>{t.modals.createTag.annotatedLabel}</span>
            </label>

            {isAnnotated && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tag-message-input" className="text-xs font-medium text-primary">
                  {t.modals.createTag.messageLabel}
                </label>
                <textarea
                  id="tag-message-input"
                  aria-label={t.modals.createTag.messageLabel}
                  placeholder={t.modals.createTag.messagePlaceholder}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  rows={3}
                  className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full resize-none"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-1.5 p-2 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {t.modals.createTag.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t.modals.createTag.creating}</span>
                  </>
                ) : (
                  <span>{t.modals.createTag.submit}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  );
};
