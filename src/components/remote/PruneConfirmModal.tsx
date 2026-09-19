import React, { useState, useEffect } from "react";
import { Scissors, Cloud } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";

export interface PruneConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  remoteName: string;
  onSuccess?: (prunedBranches: string[]) => void;
}

const TITLE_ID = "prune-remote-title";

export const PruneConfirmModal: React.FC<PruneConfirmModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  remoteName,
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
  }, [isOpen, remoteName]);

  const handlePrune = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await invokeCommand.pruneRemote(repoPath, remoteName);
      if (res.pruned_branches.length > 0) {
        useToastStore
          .getState()
          .showSuccess(
            t.modals.remotes.pruneModal.successToast.replace(
              "{count}",
              String(res.pruned_branches.length)
            )
          );
      } else {
        useToastStore.getState().showToast({
          type: "info",
          message: t.modals.remotes.pruneModal.nonePrunedToast,
        });
      }

      onSuccess?.(res.pruned_branches);
      onClose();
    } catch (err) {
      setError(mapGitError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID} stacked>
      <Modal.Header
        title={t.modals.remotes.pruneModal.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Scissors}
      />

      <Modal.Body>
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-xs text-secondary m-0 leading-relaxed">
          {t.modals.remotes.pruneModal.confirmMessage}
        </p>

        {/* Target Remote */}
        <div className="p-3 bg-window border border-border-subtle rounded-lg flex items-center gap-2.5">
          <Cloud size={16} className="text-sky-500 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Máy chủ:</span>
            <span className="text-xs font-mono font-semibold text-primary px-1.5 py-0.5 rounded bg-surface border border-border-subtle">
              {remoteName}
            </span>
          </div>
        </div>

        <Alert variant="success">{t.modals.remotes.pruneModal.safeNotice}</Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button onClick={handlePrune} loading={loading}>
          {loading ? t.modals.remotes.pruneModal.pruning : t.modals.remotes.pruneModal.confirmBtn}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
