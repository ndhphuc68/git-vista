/**
 * github IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type CheckoutPrResult, type GitHubRepoInfo } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const githubCommands = {
  getGitHubRepoInfo: async (repoPath: string): Promise<GitHubRepoInfo> => {
    if (!isTauri()) {
      return {
        is_github: true,
        owner: "antigravity-ai",
        repo: "git-vista",
        default_branch: "main",
      };
    }
    return unwrap(await commands.getGithubRepoInfo(repoPath));
  },

  getGitHubToken: async (): Promise<string | null> => {
    if (!isTauri()) {
      return localStorage.getItem("gitvista_github_token");
    }
    return unwrap(await commands.getGithubToken());
  },

  saveGitHubToken: async (token: string): Promise<void> => {
    if (!isTauri()) {
      localStorage.setItem("gitvista_github_token", token);
      return;
    }
    await commands.saveGithubToken(token);
  },

  removeGitHubToken: async (): Promise<void> => {
    if (!isTauri()) {
      localStorage.removeItem("gitvista_github_token");
      return;
    }
    await commands.removeGithubToken();
  },

  checkoutPullRequest: async (repoPath: string, prNumber: number): Promise<CheckoutPrResult> => {
    if (!isTauri()) {
      return {
        branch_name: `pr/${prNumber}`,
        message: `Đã chuyển sang nhánh pr/${prNumber} thành công.`,
      };
    }
    return unwrap(await commands.checkoutPullRequest(repoPath, prNumber));
  },
};
