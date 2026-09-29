import { useState, useEffect, useRef, useCallback } from "react";
import { useGitHubRepoInfo } from "../../features/github";
import { useBranches } from "../../features/branch";
import { createSetDefaultBranchesEffect } from "./useCreatePullRequestModal.actions";
import {
  findCurrentCompareBranchItem,
  hasUnpushedCommits as computeHasUnpushedCommits,
  getAvailableBaseBranches,
  getAvailableCompareBranches,
} from "./pullRequestBranchOptions";

/**
 * Branch-selection state for CreatePullRequestModal: base/compare branch
 * queries, the available options, and the handlers the branch selects call.
 */
export function useCreatePullRequestModalBranches(repoPath: string, isOpen: boolean) {
  const [baseBranch, setBaseBranch] = useState("");
  const [compareBranch, setCompareBranch] = useState("");
  const userChangedBaseRef = useRef(false);
  const userChangedCompareRef = useRef(false);

  const { data: repoInfo } = useGitHubRepoInfo(repoPath, { enabled: isOpen, staleTime: 60_000 });

  const { data: branchData, refetch: refetchBranches } = useBranches(repoPath, {
    enabled: isOpen,
    staleTime: 30_000,
  });

  // Set default branches when query data loads if user hasn't manually selected
  useEffect(() => {
    createSetDefaultBranchesEffect({
      isOpen,
      userChangedBaseRef,
      userChangedCompareRef,
      repoInfoDefaultBranch: repoInfo?.default_branch,
      branchDataCurrentBranch: branchData?.current_branch,
      setBaseBranch,
      setCompareBranch,
    })();
  }, [isOpen, repoInfo?.default_branch, branchData?.current_branch]);

  const currentCompareBranchItem = findCurrentCompareBranchItem(branchData, compareBranch);
  const hasUnpushedCommits = computeHasUnpushedCommits(currentCompareBranchItem);
  const availableBaseBranches = getAvailableBaseBranches(repoInfo, branchData);
  const availableCompareBranches = getAvailableCompareBranches(branchData, compareBranch);

  const handleBaseBranchChange = (value: string) => {
    setBaseBranch(value);
    userChangedBaseRef.current = true;
  };

  const handleCompareBranchChange = (value: string) => {
    setCompareBranch(value);
    userChangedCompareRef.current = true;
  };

  /** Used by the modal's open-transition reset effect; stable identity so
   *  that effect's dependency array doesn't churn every render. */
  const resetSelection = useCallback((defaultBase: string, defaultCompare: string) => {
    userChangedBaseRef.current = false;
    userChangedCompareRef.current = false;
    setBaseBranch(defaultBase);
    setCompareBranch(defaultCompare);
  }, []);

  /** Used by the modal's close-transition reset effect; stable identity for
   *  the same reason as `resetSelection`. */
  const clearSelection = useCallback(() => {
    setBaseBranch("");
    setCompareBranch("");
  }, []);

  return {
    repoInfo,
    baseBranch,
    compareBranch,
    branchDataCurrentBranch: branchData?.current_branch,
    availableBaseBranches,
    availableCompareBranches,
    currentCompareBranchItem,
    hasUnpushedCommits,
    refetchBranches,
    handleBaseBranchChange,
    handleCompareBranchChange,
    resetSelection,
    clearSelection,
  };
}
