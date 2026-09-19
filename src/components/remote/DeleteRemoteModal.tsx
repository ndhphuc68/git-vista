import React, { useState, useEffect } from "react";
import { Trash2, Cloud } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";
import type { RemoteItem } from "../../ipc/bindings";

export interface DeleteRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  remote: RemoteItem | null;
  onSuccess?: () => void;
}

const TITLE_ID = "delete-remote-title";

export const DeleteRemoteModal: React.FC<DeleteRemoteModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  remote,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen, remote]);

  const handleDelete = async () => {
    if (!remote) return;
    setLoading(true);
    setError(null);

    try {
      await invokeCommand.removeRemote(repoPath, remote.name);
      useToastStore
        .getState()
        .showSuccess(t.modals.remotes.deleteModal.successToast.replace("{name}", remote.name));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(mapGitError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && remote !== null}
      onClose={onClose}
      labelledBy={TITLE_ID}
      stacked
    >
      <Modal.Header
        title={t.modals.remotes.deleteModal.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Trash2}
        tone="danger"
      />

      <Modal.Body>
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-xs text-secondary m-0 leading-relaxed">
          {t.modals.remotes.deleteModal.confirmMessage}
        </p>

        {/* Target Remote Card */}
        <div className="p-3 bg-window border border-border-subtle rounded-lg flex items-center gap-3">
          <Cloud size={16} className="text-sky-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-primary truncate">{remote?.name}</span>
            {remote?.fetch_url && (
              <span className="text-[11px] text-tertiary font-mono truncate">
                {remote.fetch_url}
              </span>
            )}
          </div>
        </div>

        <Alert variant="warning">{t.modals.remotes.deleteModal.warning}</Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading
            ? t.modals.remotes.deleteModal.deleting
            : t.modals.remotes.deleteModal.confirmBtn}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
