import React from "react";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Modal, Button, Alert } from "../../../shared/ui";
import { useDeleteBranchForm } from "../hooks/useDeleteBranchForm";

const TITLE_ID = "delete-branch-title";

export interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  branchName: string;
  onSuccess?: (backupRef: string) => void;
  initialUnmerged?: boolean;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  branchName,
  onSuccess,
  initialUnmerged,
}) => {
  const { t, error, isUnmerged, loading, handleDelete } = useDeleteBranchForm({
    isOpen,
    repoPath,
    branchName,
    onClose,
    onSuccess,
    initialUnmerged,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.deleteBranch.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Trash2}
        tone="danger"
      />

      <Modal.Body>
        <p className="text-xs text-primary leading-normal m-0">
          {t.modals.deleteBranch.confirmMessage}
        </p>

        <div className="px-3 py-2 bg-window rounded-sm border border-border-subtle font-mono text-xs text-primary font-semibold break-all">
          {branchName}
        </div>

        {isUnmerged && (
          <Alert variant="error" showIcon={false}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold m-0">{t.modals.deleteBranch.unmergedTitle}</p>
                <p className="m-0 mt-1">{t.modals.deleteBranch.unmergedWarning}</p>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex items-start gap-2 p-2 bg-accent-subtle/40 border border-accent-subtle rounded-sm text-secondary text-[11px] leading-normal">
          <ShieldCheck size={14} className="shrink-0 text-link mt-0.5" />
          <span>
            {t.modals.deleteBranch.backupNoticePrefix}{" "}
            <code className="text-primary font-mono font-semibold">refs/gitui-backup/</code>{" "}
            {t.modals.deleteBranch.backupNoticeSuffix}
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.modals.deleteBranch.cancel}
        </Button>
        <Button variant="danger" onClick={() => handleDelete(isUnmerged)} loading={loading}>
          {loading
            ? t.modals.deleteBranch.deleting
            : isUnmerged
              ? t.modals.deleteBranch.forceDelete
              : t.modals.deleteBranch.safeDelete}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
