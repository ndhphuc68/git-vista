import React, { useState, useEffect, useRef } from "react";
import { GitBranch, X, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";

export interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommit?: string | null;
  onSuccess?: () => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [branchName, setBranchName] = useState("");
  const [checkout, setCheckout] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBranchName("");
      setCheckout(true);
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

  if (!isOpen) return null;

  const sanitizeBranchName = (val: string) => {
    // Tự động chuyển dấu cách thành '-' và loại bỏ ký tự cấm của Git
    return val.replace(/\s+/g, "-").replace(/[~^:?*\[\\@{}]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeBranchName(e.target.value);
    setBranchName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) {
      setError(t.modals.createBranch.errorEmpty);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await invokeCommand.createBranch(
        repoPath,
        trimmed,
        targetCommit ?? undefined,
        checkout
      );
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-branch-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-accent" />
            <h3
              id="create-branch-title"
              className="text-xs font-semibold text-primary m-0"
            >
              {t.modals.createBranch.title}
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
          {targetCommit && (
            <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
              <span>{t.modals.createBranch.fromCommit}</span>
              <span className="font-mono text-primary font-semibold">
                {targetCommit.substring(0, 7)}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="branch-name-input"
              className="text-xs font-medium text-primary"
            >
              {t.modals.createBranch.nameLabel}
            </label>
            <input
              ref={inputRef}
              id="branch-name-input"
              aria-label={t.modals.createBranch.nameLabel}
              type="text"
              placeholder={t.modals.createBranch.namePlaceholder}
              value={branchName}
              onChange={handleNameChange}
              disabled={loading}
              className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
            <input
              type="checkbox"
              checked={checkout}
              onChange={(e) => setCheckout(e.target.checked)}
              disabled={loading}
              aria-label={t.modals.createBranch.checkoutLabel}
              className="accent-accent cursor-pointer rounded-sm"
            />
            <span>{t.modals.createBranch.checkoutLabel}</span>
          </label>

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
              {t.modals.createBranch.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !branchName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{t.modals.createBranch.creating}</span>
                </>
              ) : (
                <span>{t.modals.createBranch.submit}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
