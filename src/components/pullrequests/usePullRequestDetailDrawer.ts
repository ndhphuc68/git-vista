import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../i18n";
import { useGitHubRepoInfo, useGitHubToken, checkoutPullRequest } from "../../features/github";
import { fetchPullRequestDetail } from "../../services/githubService";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useToastStore } from "../../store/useToastStore";
import { qk } from "../../domain/queryKeys";
import { messageOf } from "../../shared/utils/toError";

/**
 * Holds all state, effects and handlers for PullRequestDetailDrawer.
 * Returns exactly what the drawer's JSX reads.
 */
export function usePullRequestDetailDrawer(repoPath: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isDrawerOpen, selectedPr, closeDrawer } = usePullRequestStore();
  const { showToast, showSuccess, showError } = useToastStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const { data: repoInfo } = useGitHubRepoInfo(repoPath);

  const { data: token } = useGitHubToken();

  // selectedPr?.number can be undefined before a PR is selected; `enabled` below
  // ensures the query only runs once there's a valid PR number, so ?? 0 is just a placeholder.
  const { data: detail } = useQuery({
    queryKey: qk.github.pullRequestDetail(repoPath, selectedPr?.number ?? 0),
    queryFn: () => {
      if (!repoInfo?.owner || !repoInfo?.repo || !selectedPr?.number) {
        throw new Error("Missing parameters for PR detail");
      }
      return fetchPullRequestDetail(repoInfo.owner, repoInfo.repo, selectedPr.number, token);
    },
    enabled: Boolean(isDrawerOpen && repoInfo?.owner && repoInfo?.repo && selectedPr?.number),
  });

  const pr = detail?.pr || selectedPr;

  const handleCheckout = async () => {
    if (!pr) return;
    setIsCheckingOut(true);
    try {
      showToast({ message: t.pullRequests.checkingOut, type: "info" });
      const res = await checkoutPullRequest(repoPath, pr.number);
      showSuccess(t.pullRequests.checkoutSuccess.replace("{branch}", res.branch_name));
      queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    } catch (err: unknown) {
      showError(messageOf(err) || "Lỗi khi checkout nhánh PR");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCopyLink = async () => {
    if (pr?.html_url && navigator.clipboard) {
      await navigator.clipboard.writeText(pr.html_url);
      showSuccess(t.pullRequests.linkCopied);
    }
  };

  return {
    t,
    isDrawerOpen,
    closeDrawer,
    isCheckingOut,
    detail,
    pr,
    handleCheckout,
    handleCopyLink,
  };
}
