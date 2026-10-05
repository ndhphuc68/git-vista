import { type MutableRefObject, type FormEvent } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { getGitHubToken } from "../../features/github";
import { pushRepo } from "../../features/remote";
import { createPullRequest } from "../../services/githubService";
import { useToastStore } from "../../store/useToastStore";
import { qk } from "../../domain/queryKeys";
import { type Translations } from "../../i18n/vi";
import { type GitHubRepoInfo, type BranchItem } from "../../ipc/bindings.generated";
import { toErrorMessage } from "../../shared/utils/toError";

interface PushBranchContext {
  repoPath: string;
  compareBranch: string;
  currentCompareBranchItem: BranchItem | undefined;
  setIsPushing: (value: boolean) => void;
  setError: (value: string | null) => void;
  refetchBranches: () => Promise<unknown>;
}

/** Factory for CreatePullRequestModal's "push branch" handler (verbatim move). */
export function createHandlePushBranch(context: PushBranchContext) {
  const {
    repoPath,
    compareBranch,
    currentCompareBranchItem,
    setIsPushing,
    setError,
    refetchBranches,
  } = context;
  return async () => {
    if (!compareBranch) return;
    setIsPushing(true);
    setError(null);
    try {
      const hasUpstream = Boolean(currentCompareBranchItem?.upstream);
      await pushRepo(repoPath, undefined, compareBranch, !hasUpstream, { force: false });
      await refetchBranches();
      useToastStore.getState().showToast({
        message: "Push thành công",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg);
    } finally {
      setIsPushing(false);
    }
  };
}

interface SubmitContext {
  repoPath: string;
  title: string;
  body: string;
  baseBranch: string;
  compareBranch: string;
  isDraft: boolean;
  repoInfo: GitHubRepoInfo | undefined;
  t: Translations;
  queryClient: QueryClient;
  handleClose: () => void;
  setError: (value: string | null) => void;
  setSubmitting: (value: boolean) => void;
}

/** Factory for CreatePullRequestModal's form submit handler (verbatim move). */
export function createHandleSubmit(context: SubmitContext) {
  const {
    repoPath,
    title,
    body,
    baseBranch,
    compareBranch,
    isDraft,
    repoInfo,
    t,
    queryClient,
    handleClose,
    setError,
    setSubmitting,
  } = context;
  return async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const owner = repoInfo?.owner;
    const repo = repoInfo?.repo;
    if (!repoInfo?.is_github || !owner || !repo) {
      setError(t.pullRequests.notGitHub);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getGitHubToken();
      if (!token) {
        setError(t.pullRequests.needToken);
        setSubmitting(false);
        return;
      }

      const newPr = await createPullRequest(
        owner,
        repo,
        {
          title: trimmedTitle,
          head: compareBranch,
          base: baseBranch,
          body: body.trim(),
          draft: isDraft,
        },
        token
      );

      useToastStore.getState().showToast({
        message: t.pullRequests.createSuccess.replace("{number}", String(newPr.number)),
        type: "success",
      });

      // This used to use a predicate searching for the string "github-pull-requests" —
      // that string existed in no key, so the call matched nothing and the PR list
      // never refreshed after creating a PR. Using the qk prefix instead refreshes
      // every status filter, since we don't know which one the user is currently viewing.
      queryClient.invalidateQueries({ queryKey: qk.github.pullRequestsAll(repoPath) });

      handleClose();
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg || t.common.error);
    } finally {
      setSubmitting(false);
    }
  };
}

interface ResetFormEffectContext {
  isOpen: boolean;
  prevOpenRef: MutableRefObject<boolean>;
  repoInfoDefaultBranch: string | null | undefined;
  branchDataCurrentBranch: string | null | undefined;
  setTitle: (value: string) => void;
  setBody: (value: string) => void;
  setIsDraft: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSubmitting: (value: boolean) => void;
  setIsPushing: (value: boolean) => void;
  resetBranchSelection: (defaultBase: string, defaultCompare: string) => void;
  clearBranchSelection: () => void;
}

interface SetDefaultBranchesEffectContext {
  isOpen: boolean;
  userChangedBaseRef: MutableRefObject<boolean>;
  userChangedCompareRef: MutableRefObject<boolean>;
  repoInfoDefaultBranch: string | null | undefined;
  branchDataCurrentBranch: string | null | undefined;
  setBaseBranch: (value: string) => void;
  setCompareBranch: (value: string) => void;
}

/**
 * Factory for the "set default branches when query data loads if user hasn't
 * manually selected" effect body (verbatim move).
 */
export function createSetDefaultBranchesEffect(context: SetDefaultBranchesEffectContext) {
  const {
    isOpen,
    userChangedBaseRef,
    userChangedCompareRef,
    repoInfoDefaultBranch,
    branchDataCurrentBranch,
    setBaseBranch,
    setCompareBranch,
  } = context;
  return () => {
    if (isOpen) {
      if (!userChangedBaseRef.current && repoInfoDefaultBranch) {
        setBaseBranch(repoInfoDefaultBranch);
      }
      if (!userChangedCompareRef.current && branchDataCurrentBranch) {
        setCompareBranch(branchDataCurrentBranch);
      }
    }
  };
}

/** Factory for the "reset form only when modal opens" effect body (verbatim move). */
export function createResetFormEffect(context: ResetFormEffectContext) {
  const {
    isOpen,
    prevOpenRef,
    repoInfoDefaultBranch,
    branchDataCurrentBranch,
    setTitle,
    setBody,
    setIsDraft,
    setError,
    setSubmitting,
    setIsPushing,
    resetBranchSelection,
    clearBranchSelection,
  } = context;
  return () => {
    if (isOpen && !prevOpenRef.current) {
      setTitle("");
      setBody("");
      setIsDraft(false);
      setError(null);
      setSubmitting(false);
      setIsPushing(false);
      resetBranchSelection(repoInfoDefaultBranch || "main", branchDataCurrentBranch || "main");
    } else if (!isOpen && prevOpenRef.current) {
      clearBranchSelection();
    }
    prevOpenRef.current = isOpen;
  };
}
