import { useEffect, useRef } from "react";
import { createResetFormEffect } from "./useCreatePullRequestModal.actions";
import { type useCreatePullRequestModalForm } from "./useCreatePullRequestModalForm";

interface UseResetCreatePullRequestFormArgs {
  isOpen: boolean;
  repoInfoDefaultBranch: string | null | undefined;
  branchDataCurrentBranch: string | null | undefined;
  resetBranchSelection: (defaultBase: string, defaultCompare: string) => void;
  clearBranchSelection: () => void;
  form: ReturnType<typeof useCreatePullRequestModalForm>;
}

/**
 * Resets CreatePullRequestModal's form and branch selection only on the
 * isOpen: false -> true transition, and clears branch selection on close.
 */
export function useResetCreatePullRequestForm({
  isOpen,
  repoInfoDefaultBranch,
  branchDataCurrentBranch,
  resetBranchSelection,
  clearBranchSelection,
  form,
}: UseResetCreatePullRequestFormArgs) {
  const prevOpenRef = useRef(false);

  useEffect(() => {
    createResetFormEffect({
      isOpen,
      prevOpenRef,
      repoInfoDefaultBranch,
      branchDataCurrentBranch,
      setTitle: form.setTitle,
      setBody: form.setBody,
      setIsDraft: form.setIsDraft,
      setError: form.setError,
      setSubmitting: form.setSubmitting,
      setIsPushing: form.setIsPushing,
      resetBranchSelection,
      clearBranchSelection,
    })();
  }, [
    isOpen,
    repoInfoDefaultBranch,
    branchDataCurrentBranch,
    resetBranchSelection,
    clearBranchSelection,
    form.setTitle,
    form.setBody,
    form.setIsDraft,
    form.setError,
    form.setSubmitting,
    form.setIsPushing,
  ]);
}
