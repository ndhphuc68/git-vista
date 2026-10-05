import type { QueryClient } from "@tanstack/react-query";
import { checkoutPullRequest } from "../../github";
import { qk } from "../../../domain/queryKeys";
import { usePullRequestStore } from "../../../store/usePullRequestStore";
import { toErrorMessage } from "../../../shared/utils/toError";
import type { GitHubPullRequest } from "../../../ipc/githubApi";
import type { PullRequestState } from "../../../domain/enums";
import type { Translations } from "../../../i18n/vi";

export interface PullRequestsScreenActionsContext {
  repoPath: string;
  t: Translations;
  queryClient: QueryClient;
  showToast: (options: { message: string; type: "info" | "success" | "error" }) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  setIsCheckingOut?: (value: boolean) => void;
}

export function createPullRequestsScreenActions(context: PullRequestsScreenActionsContext) {
  const { repoPath, t, queryClient, showToast, showSuccess, showError, setIsCheckingOut } = context;

  const handleCheckout = async (pr: GitHubPullRequest) => {
    setIsCheckingOut?.(true);
    try {
      showToast({ message: t.pullRequests.checkingOut, type: "info" });
      const res = await checkoutPullRequest(repoPath, pr.number);
      showSuccess(t.pullRequests.checkoutSuccess.replace("{branch}", res.branch_name));
      await queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      await queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    } catch (err: unknown) {
      showError(toErrorMessage(err));
    } finally {
      setIsCheckingOut?.(false);
    }
  };

  const handleCopyLink = async (pr: GitHubPullRequest) => {
    if (pr.html_url && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(pr.html_url);
      showSuccess(t.pullRequests.linkCopied);
    }
  };

  const handleOpenBrowser = (pr: GitHubPullRequest) => {
    if (pr.html_url && typeof window !== "undefined") {
      window.open(pr.html_url, "_blank");
    }
  };

  const handleNewPr = () => {
    usePullRequestStore.getState().openCreateModal();
  };

  const handleRefresh = async (filterState: PullRequestState, selectedPrNumber?: number | null) => {
    await queryClient.invalidateQueries({
      queryKey: qk.github.pullRequests(repoPath, filterState),
    });
    if (selectedPrNumber) {
      await queryClient.invalidateQueries({
        queryKey: qk.github.pullRequestDetail(repoPath, selectedPrNumber),
      });
    }
  };

  return {
    handleCheckout,
    handleCopyLink,
    handleOpenBrowser,
    handleNewPr,
    handleRefresh,
  };
}
