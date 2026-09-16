import React, { useState, useEffect, useRef } from "react";
import { Edit3, X, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

export interface RenameBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  currentName: string;
  onSuccess?: () => void;
}

export const RenameBranchModal: React.FC<RenameBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  currentName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName]);

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


  const sanitizeBranchName = (val: string) => {
    return val.replace(/\s+/g, "-").replace(/[~^:?*\[\\@{}]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeBranchName(e.target.value);
    setNewName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t.modals.renameBranch.errorEmpty);
      return;
    }
    if (trimmed === currentName) {
      setError(t.modals.renameBranch.errorSame);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await invokeCommand.renameBranch(repoPath, currentName, trimmed);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition
      show={isOpen}
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 modal-backdrop flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-branch-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-accent" />
            <h3
              id="rename-branch-title"
              className="text-xs font-semibold text-primary m-0"
            >
              {t.modals.renameBranch.title}
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
          <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
            <span>{t.modals.renameBranch.currentLabel}:</span>
            <span className="font-mono text-primary font-semibold">
              {currentName}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rename-branch-input"
              className="text-xs font-medium text-primary"
            >
              {t.modals.renameBranch.newLabel}
            </label>
            <input
              ref={inputRef}
              id="rename-branch-input"
              aria-label={t.modals.renameBranch.newLabel}
              type="text"
              value={newName}
              onChange={handleNameChange}
              disabled={loading}
              className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
            />
          </div>

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
              {t.modals.renameBranch.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim() || newName.trim() === currentName}
              className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{t.modals.renameBranch.renaming}</span>
                </>
              ) : (
                <span>{t.modals.renameBranch.submit}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Transition>
  );
};
