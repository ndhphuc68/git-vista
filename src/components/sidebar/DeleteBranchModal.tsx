import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { useTranslation } from "../../i18n";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "delete-branch-title";

export interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  branchName: string;
  onSuccess?: (backupRef: string) => void;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  branchName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnmerged, setIsUnmerged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError(null);
      setIsUnmerged(false);
    }
  }, [isOpen, branchName]);

  const handleDelete = async (force: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const backupRef = await invokeCommand.deleteBranch(repoPath, branchName, force);
      useToastStore.getState().showToast({
        message: t.modals.deleteBranch.successToast.replace("{name}", branchName),
        type: "success",
        durationMs: 10000,
        undoAction: async () => {
          await invokeCommand.undoDeleteBranch(repoPath, branchName, backupRef);
        },
      });
      if (onSuccess) onSuccess(backupRef);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNMERGED_BRANCH")) {
        setIsUnmerged(true);
      } else {
        setError(msg || t.modals.deleteBranch.errorGeneric);
        useToastStore.getState().showError(mapGitError(err));
      }
    } finally {
      setLoading(false);
    }
  };

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
          <ShieldCheck size={14} className="shrink-0 text-accent mt-0.5" />
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
