import React, { useState, useEffect, useRef } from "react";
import { Edit3 } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "rename-branch-title";

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
  // One-shot latch: the prefilled name is selected once per opening. Without
  // it the effect below re-selects on every keystroke, so the next character
  // typed would wipe what the user had just typed.
  const hasSelectedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setLoading(false);
      hasSelectedRef.current = false;
    }
  }, [isOpen, currentName]);

  // Modal's data-autofocus focuses this field, but it fires while the value
  // is still empty — React fills it in the same commit, which collapses the
  // selection to the end. The old implementation dodged that with a 50ms
  // timer. Selecting once the value has actually landed does the same thing
  // without one, so typing still replaces the name outright.
  useEffect(() => {
    if (!isOpen || hasSelectedRef.current) return;
    const input = inputRef.current;
    if (input && input.value && document.activeElement === input) {
      hasSelectedRef.current = true;
      input.select();
    }
  }, [isOpen, newName]);

  const sanitizeBranchName = (val: string) => {
    return val.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
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
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.renameBranch.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Edit3}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
            <span>{t.modals.renameBranch.currentLabel}:</span>
            <span className="font-mono text-primary font-semibold">{currentName}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rename-branch-input" className="text-xs font-medium text-primary">
              {t.modals.renameBranch.newLabel}
            </label>
            <input
              id="rename-branch-input"
              ref={inputRef}
              data-autofocus
              aria-label={t.modals.renameBranch.newLabel}
              type="text"
              value={newName}
              onChange={handleNameChange}
              disabled={loading}
              className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.renameBranch.cancel}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!newName.trim() || newName.trim() === currentName}
          >
            {loading ? t.modals.renameBranch.renaming : t.modals.renameBranch.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
