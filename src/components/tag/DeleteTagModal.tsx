import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Tag } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";

const TITLE_ID = "delete-tag-title";

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
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.deleteTag.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Trash2}
        tone="danger"
      />

      <Modal.Body>
        <Alert variant="error" showIcon={false}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{t.modals.deleteTag.confirmMessage}</span>
          </div>
        </Alert>

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

        {error && <Alert variant="error">{error}</Alert>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.modals.deleteTag.cancel}
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? t.modals.deleteTag.deleting : t.modals.deleteTag.submit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
