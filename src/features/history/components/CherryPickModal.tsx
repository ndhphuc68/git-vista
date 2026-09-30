import React, { useState, useEffect } from "react";
import { GitPullRequest } from "lucide-react";
import type { CommitActionResult } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { Modal, Button, Alert } from "../../../shared/ui";
import { cherryPickCommit } from "../api/commitActionsApi";
import { CommitActionTargetCard } from "./CommitActionTargetCard";
import { AutoCommitCheckbox } from "./AutoCommitCheckbox";
import { CherryPickDestinationBranch } from "./CherryPickDestinationBranch";
import { toErrorMessage } from "../../../shared/utils/toError";

const TITLE_ID = "cherry-pick-title";

export interface CherryPickModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  targetCommit: {
    id: string;
    short_id: string;
    summary: string;
    author: string;
    time?: string;
  };
  currentBranch?: string;
  onSuccess?: (result: CommitActionResult) => void;
}

export const CherryPickModal: React.FC<CherryPickModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  currentBranch,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [autoCommit, setAutoCommit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAutoCommit(true);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await cherryPickCommit(repoPath, targetCommit.id, autoCommit);

      if (res.success || res.status === "Conflict") {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg =
          res.output || t.modals.cherryPick.genericError.replace("{msg}", res.status);
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.cherryPick.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitPullRequest}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body>
          <CommitActionTargetCard label={t.modals.cherryPick.targetCommit} targetCommit={targetCommit} />

          {currentBranch && <CherryPickDestinationBranch currentBranch={currentBranch} />}

          <AutoCommitCheckbox
            checked={autoCommit}
            onChange={setAutoCommit}
            disabled={loading}
            label={t.modals.cherryPick.autoCommitLabel}
            description={t.modals.cherryPick.autoCommitDesc}
          />

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.cherryPick.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? t.modals.cherryPick.submitting : t.modals.cherryPick.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
