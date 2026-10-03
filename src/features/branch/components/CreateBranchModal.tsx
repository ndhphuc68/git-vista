import React from "react";
import { GitBranch } from "lucide-react";
import { Modal, Button, Alert } from "../../../shared/ui";
import { useCreateBranchForm } from "../hooks/useCreateBranchForm";
import { CreateBranchFormFields } from "./CreateBranchFormFields";

const TITLE_ID = "create-branch-title";

export interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  /** Commit OID or ref the new branch starts at; HEAD when absent. */
  targetCommit?: string | null;
  /** Branch name shown instead of the commit when targetCommit is that branch's ref. */
  sourceBranch?: string;
  onSuccess?: () => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  targetCommit,
  sourceBranch,
  onSuccess,
}) => {
  const {
    t,
    branchData,
    branchName,
    selectedBaseRef,
    checkout,
    setCheckout,
    error,
    loading,
    handleNameChange,
    handleBaseRefChange,
    handleSubmit,
  } = useCreateBranchForm({ isOpen, repoPath, targetCommit, sourceBranch, onClose, onSuccess });

  const isCommitTarget = Boolean(
    targetCommit && !sourceBranch && !targetCommit.startsWith("refs/")
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Modal.Header
        title={t.modals.createBranch.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={GitBranch}
      />

      {/* The form wraps Body and Footer so Enter and the submit button both
          still submit across the two sections. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="overflow-visible min-h-[320px]">
          <CreateBranchFormFields
            selectProps={{
              label: t.modals.createBranch.fromBranch,
              ariaLabel: t.modals.createBranch.baseBranchLabel,
              value: selectedBaseRef,
              onChange: handleBaseRefChange,
              disabled: loading,
              isCommitTarget,
              targetCommit,
              sourceBranch,
              commitPrefix: t.modals.createBranch.commitOptionPrefix,
              localLabel: t.modals.createBranch.localBranchesGroup,
              remoteLabel: t.modals.createBranch.remoteBranchesGroup,
              localBranches: branchData?.local ?? [],
              remoteBranches: branchData?.remote ?? [],
              currentBranchName: branchData?.current_branch,
              searchPlaceholder: t.modals.createBranch.searchBranchPlaceholder,
              noBranchesFoundText: t.modals.createBranch.noBranchesFound,
            }}
            nameLabel={t.modals.createBranch.nameLabel}
            namePlaceholder={t.modals.createBranch.namePlaceholder}
            branchName={branchName}
            onNameChange={handleNameChange}
            checkoutLabel={t.modals.createBranch.checkoutLabel}
            checkout={checkout}
            onCheckoutChange={setCheckout}
            loading={loading}
          />

          {error && <Alert variant="error">{error}</Alert>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.modals.createBranch.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={!branchName.trim()}>
            {loading ? t.modals.createBranch.creating : t.modals.createBranch.submit}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
