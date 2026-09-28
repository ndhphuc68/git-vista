/**
 * Query hooks and thin wrappers over the GitHub IPC commands (repo info,
 * personal-access-token storage, and PR checkout). This module lives in
 * `features/github/api`, the only place in `features/github` allowed to
 * import `ipc/`; the pull-request components and the GitHub settings tab
 * compose these instead of calling `invokeCommand` directly.
 */
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { type CheckoutPrResult } from "../../../ipc/bindings.generated";
import { qk } from "../../../domain/queryKeys";

/**
 * GitHub repo info (owner, repo, default branch) for `repoPath`.
 *
 * `PullRequestDetailDrawer` and `PullRequestsSection` both fetch this with
 * `enabled: Boolean(repoPath)` and no extra options; `options` lets
 * `CreatePullRequestModal` override `enabled`/`staleTime` while every other
 * call site keeps today's behavior via the defaults below.
 */
export function useGitHubRepoInfo(
  repoPath: string,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: qk.github.repoInfo(repoPath),
    queryFn: () => invokeCommand.getGitHubRepoInfo(repoPath),
    enabled: options?.enabled ?? Boolean(repoPath),
    // An explicit `staleTime: undefined` would still override the app
    // QueryClient's global default (see App.tsx), dropping effective
    // staleTime to 0 for every caller that omits `options`. Only include
    // the key when the caller actually supplied a value.
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
  });
}

/** The stored GitHub personal access token, if any. */
export function useGitHubToken() {
  return useQuery({
    queryKey: qk.githubToken(),
    queryFn: () => invokeCommand.getGitHubToken(),
  });
}

/** Reads the stored GitHub personal access token, if any. */
export function getGitHubToken(): Promise<string | null> {
  return invokeCommand.getGitHubToken();
}

/** Saves `token` as the GitHub personal access token. */
export function saveGitHubToken(token: string): Promise<void> {
  return invokeCommand.saveGitHubToken(token);
}

/** Removes the stored GitHub personal access token. */
export function removeGitHubToken(): Promise<void> {
  return invokeCommand.removeGitHubToken();
}

/** Checks out the branch for pull request `prNumber` in `repoPath`. */
export function checkoutPullRequest(
  repoPath: string,
  prNumber: number
): Promise<CheckoutPrResult> {
  return invokeCommand.checkoutPullRequest(repoPath, prNumber);
}
