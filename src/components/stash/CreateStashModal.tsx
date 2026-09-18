import React, { useState, useEffect } from "react";
import { X, Archive } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

interface CreateStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  onSaveStash: (message: string, includeUntracked: boolean) => Promise<string>;
}

export const CreateStashModal: React.FC<CreateStashModalProps> = ({
  isOpen,
  onClose,
  repoPath: _repoPath,
  onSaveStash,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [includeUntracked, setIncludeUntracked] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setIncludeUntracked(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSaveStash(message, includeUntracked);
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
        aria-labelledby="create-stash-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-md shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Archive size={16} className="text-accent" />
              <h3 id="create-stash-title" className="text-xs font-semibold text-primary m-0">
                {t.modals.createStash.title}
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
            <div className="flex flex-col gap-1">
              <label htmlFor="stash-message" className="text-xs text-secondary font-medium">
                {t.modals.createStash.descLabel}
              </label>
              <input
                id="stash-message"
                type="text"
                placeholder={t.modals.createStash.descPlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="px-3 py-1.5 bg-window border border-border-subtle rounded-sm text-xs text-primary outline-none focus:border-accent transition-colors"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="stash-include-untracked"
                type="checkbox"
                checked={includeUntracked}
                onChange={(e) => setIncludeUntracked(e.target.checked)}
                disabled={loading}
                className="w-3 h-3 accent-accent cursor-pointer"
              />
              <label
                htmlFor="stash-include-untracked"
                className="text-xs text-primary cursor-pointer select-none"
              >
                {t.modals.createStash.untrackedLabel}
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
              {t.modals.createStash.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? t.modals.createStash.saving : t.modals.createStash.submit}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
};
