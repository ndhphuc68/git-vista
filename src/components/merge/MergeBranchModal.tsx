import React from "react";
import { GitMerge, ArrowRight } from "lucide-react";
import { Modal, Button, Alert, Checkbox } from "../../shared/ui";
import { useMergeBranchModal } from "./useMergeBranchModal";

const TITLE_ID = "merge-branch-title";

export interface MergeBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: string;
  targetBranch: string;
  hasUncommittedChanges: boolean;
  onMerge: (noFf: boolean) => Promise<{ success: boolean; status: string; output: string }>;
}

export const MergeBranchModal: React.FC<MergeBranchModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  targetBranch,
  hasUncommittedChanges,
  onMerge,
}) => {
  const { t, noFf, setNoFf, loading, error, handleMergeSubmit } = useMergeBranchModal(
    isOpen,
    onMerge,
    onClose
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.merge.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitMerge}
      />

      <Modal.Body>
        <div className="flex items-center gap-2 text-xs text-primary bg-window p-2.5 rounded-sm border border-border-subtle">
          <span className="font-semibold text-accent">{targetBranch}</span>
          <ArrowRight size={13} className="text-secondary shrink-0" />
          <span className="font-semibold text-primary">{currentBranch}</span>
        </div>

        <p className="text-xs text-secondary leading-normal m-0">{t.modals.merge.desc}</p>

        {hasUncommittedChanges && <Alert variant="error">{t.modals.merge.uncommittedWarn}</Alert>}

        {error && (
          <Alert variant="error" showIcon={false}>
            {error}
          </Alert>
        )}

        <div className="flex items-center gap-2 mt-1">
          <Checkbox
            id="merge-no-ff"
            checked={noFf}
            onChange={(e) => setNoFf(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="merge-no-ff" className="text-xs text-primary cursor-pointer select-none">
            {t.modals.merge.noFfLabel}
          </label>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.modals.merge.cancel}
        </Button>
        <Button aria-label={t.modals.merge.submit} onClick={handleMergeSubmit} loading={loading}>
          <GitMerge size={13} />
          {loading ? t.modals.merge.merging : t.modals.merge.submit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
