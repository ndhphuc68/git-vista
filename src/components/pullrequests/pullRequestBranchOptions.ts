import {
  type BranchListResult,
  type BranchItem,
  type GitHubRepoInfo,
} from "../../ipc/bindings.generated";

/** Finds the branch list entry matching `compareBranch`, if any. */
export function findCurrentCompareBranchItem(
  branchData: BranchListResult | undefined,
  compareBranch: string
): BranchItem | undefined {
  return branchData?.local.find((b) => b.name === compareBranch);
}

/** Whether the given compare branch item has commits not yet pushed upstream. */
export function hasUnpushedCommits(item: BranchItem | undefined): boolean {
  return Boolean(item && (item.ahead > 0 || !item.upstream));
}

/** Base branch candidates: repo default branch + remote branches + local branches (deduplicated). */
export function getAvailableBaseBranches(
  repoInfo: GitHubRepoInfo | undefined,
  branchData: BranchListResult | undefined
): string[] {
  return Array.from(
    new Set([
      ...(repoInfo?.default_branch ? [repoInfo.default_branch] : ["main"]),
      ...(branchData?.remote.map((b) => b.name.replace(/^origin\//, "")) || []),
      ...(branchData?.local.map((b) => b.name) || []),
    ])
  );
}

/** Compare branch candidates: local branches, falling back to the current selection. */
export function getAvailableCompareBranches(
  branchData: BranchListResult | undefined,
  compareBranch: string
): string[] {
  return Array.from(new Set(branchData?.local.map((b) => b.name) || [compareBranch]));
}
