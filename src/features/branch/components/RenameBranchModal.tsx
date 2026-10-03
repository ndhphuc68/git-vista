import React from "react";
import { Edit3 } from "lucide-react";
import { Modal, Button, Alert, Input } from "../../../shared/ui";
import { useRenameBranchForm } from "../hooks/useRenameBranchForm";

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
  const { t, newName, error, loading, inputRef, handleNameChange, handleSubmit } =
    useRenameBranchForm({ isOpen, repoPath, currentName, onClose, onSuccess });

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
            <Input
              id="rename-branch-input"
              ref={inputRef}
              data-autofocus
              aria-label={t.modals.renameBranch.newLabel}
              value={newName}
              onChange={handleNameChange}
              disabled={loading}
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
