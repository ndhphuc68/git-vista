import { type MouseEvent } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { checkoutPullRequest } from "../../features/github";
import { qk } from "../../domain/queryKeys";
import { type Translations } from "../../i18n/vi";
import { type GitHubPullRequest } from "../../ipc/githubApi";
import { messageOf } from "../../shared/utils/toError";

interface PullRequestMenuActionsContext {
  repoPath: string;
  t: Translations;
  queryClient: QueryClient;
  setActiveMenuPr: (value: number | null) => void;
  showToast: (toast: { message: string; type: "info" | "success" | "error" }) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

/**
 * Factory for PullRequestsSection's context-menu handlers (checkout, open in
 * browser, copy link): a verbatim move of the three handler bodies.
 */
export function createPullRequestMenuActions(context: PullRequestMenuActionsContext) {
  const { repoPath, t, queryClient, setActiveMenuPr, showToast, showSuccess, showError } = context;

  const handleCheckoutPr = async (pr: GitHubPullRequest, e?: MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    try {
      showToast({ message: t.pullRequests.checkingOut, type: "info" });
      const res = await checkoutPullRequest(repoPath, pr.number);
      showSuccess(t.pullRequests.checkoutSuccess.replace("{branch}", res.branch_name));
      queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    } catch (err: unknown) {
      showError(messageOf(err) || "Lỗi khi checkout nhánh PR");
    }
  };

  const handleOpenBrowser = (pr: GitHubPullRequest, e?: MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    if (pr.html_url) {
      window.open(pr.html_url, "_blank");
    }
  };

  const handleCopyLink = async (pr: GitHubPullRequest, e?: MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuPr(null);
    if (pr.html_url && navigator.clipboard) {
      await navigator.clipboard.writeText(pr.html_url);
      showSuccess(t.pullRequests.linkCopied);
    }
  };

  return { handleCheckoutPr, handleOpenBrowser, handleCopyLink };
}
