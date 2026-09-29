import { useQueryClient } from "@tanstack/react-query";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useTranslation } from "../../i18n";
import { useCreatePullRequestModalBranches } from "./useCreatePullRequestModalBranches";
import { useCreatePullRequestModalForm } from "./useCreatePullRequestModalForm";
import { useResetCreatePullRequestForm } from "./useResetCreatePullRequestForm";
import { createHandlePushBranch, createHandleSubmit } from "./useCreatePullRequestModal.actions";

export interface UseCreatePullRequestModalArgs {
  repoPath: string;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Holds all state, effects and handlers for CreatePullRequestModal.
 * Returns exactly what the modal's JSX reads.
 */
export function useCreatePullRequestModal({
  repoPath,
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}: UseCreatePullRequestModalArgs) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const storeIsOpen = usePullRequestStore((s) => s.isCreateModalOpen);
  const storeClose = usePullRequestStore((s) => s.closeCreateModal);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : storeIsOpen;
  const handleClose = propsOnClose !== undefined ? propsOnClose : storeClose;

  const branches = useCreatePullRequestModalBranches(repoPath, isOpen);
  const form = useCreatePullRequestModalForm();

  useResetCreatePullRequestForm({
    isOpen,
    repoInfoDefaultBranch: branches.repoInfo?.default_branch,
    branchDataCurrentBranch: branches.branchDataCurrentBranch,
    resetBranchSelection: branches.resetSelection,
    clearBranchSelection: branches.clearSelection,
    form,
  });

  const handlePushBranch = createHandlePushBranch({
    repoPath,
    compareBranch: branches.compareBranch,
    currentCompareBranchItem: branches.currentCompareBranchItem,
    setIsPushing: form.setIsPushing,
    setError: form.setError,
    refetchBranches: branches.refetchBranches,
  });

  const handleSubmit = createHandleSubmit({
    repoPath,
    title: form.title,
    body: form.body,
    baseBranch: branches.baseBranch,
    compareBranch: branches.compareBranch,
    isDraft: form.isDraft,
    repoInfo: branches.repoInfo,
    t,
    queryClient,
    handleClose,
    setError: form.setError,
    setSubmitting: form.setSubmitting,
  });

  return {
    t,
    isOpen,
    handleClose,
    repoInfo: branches.repoInfo,
    baseBranch: branches.baseBranch,
    compareBranch: branches.compareBranch,
    title: form.title,
    body: form.body,
    setBody: form.setBody,
    isDraft: form.isDraft,
    setIsDraft: form.setIsDraft,
    submitting: form.submitting,
    isPushing: form.isPushing,
    error: form.error,
    titleInputRef: form.titleInputRef,
    availableBaseBranches: branches.availableBaseBranches,
    availableCompareBranches: branches.availableCompareBranches,
    hasUnpushedCommits: branches.hasUnpushedCommits,
    handlePushBranch,
    handleSubmit,
    handleBaseBranchChange: branches.handleBaseBranchChange,
    handleCompareBranchChange: branches.handleCompareBranchChange,
    handleTitleChange: form.handleTitleChange,
  };
}
