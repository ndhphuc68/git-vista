import type { BranchItem } from "../../../ipc/bindings.generated";
import { shortSha } from "../../../shared/utils/git";

export interface BaseBranchEntry {
  value: string;
  label: string;
  isHead: boolean;
}

export interface BaseBranchSection {
  kind: "commit" | "local" | "remote";
  entries: BaseBranchEntry[];
}

export interface BaseBranchSource {
  value: string;
  isCommitTarget?: boolean;
  targetCommit?: string | null;
  sourceBranch?: string;
  localBranches: BranchItem[];
  remoteBranches: BranchItem[];
  currentBranchName?: string | null;
}

/**
 * The commit / local / remote sections of the base branch dropdown. The
 * current branch maps to "" (HEAD) unless the modal was opened on a
 * specific commit or ref, in which case every branch uses its full ref.
 */
export function buildBaseBranchSections(source: BaseBranchSource): BaseBranchSection[] {
  const { isCommitTarget, targetCommit, localBranches, remoteBranches, currentBranchName } = source;
  const sections: BaseBranchSection[] = [];

  if (isCommitTarget && targetCommit) {
    sections.push({
      kind: "commit",
      entries: [{ value: targetCommit, label: shortSha(targetCommit), isHead: false }],
    });
  }

  const local = localBranches.map((branch) => {
    const isHead = branch.is_head || branch.name === currentBranchName;
    return {
      value: !targetCommit && isHead ? "" : `refs/heads/${branch.name}`,
      label: branch.name,
      isHead,
    };
  });
  if (local.length > 0) sections.push({ kind: "local", entries: local });

  const remote = remoteBranches.map((branch) => ({
    value: `refs/remotes/${branch.name}`,
    label: branch.name,
    isHead: false,
  }));
  if (remote.length > 0) sections.push({ kind: "remote", entries: remote });

  return sections;
}

/** Trigger text when `value` matches no listed option (e.g. branches still loading). */
export function baseBranchFallbackLabel(source: BaseBranchSource): string {
  const { value, sourceBranch, isCommitTarget, targetCommit, currentBranchName } = source;
  if (value) {
    if (value.startsWith("refs/heads/")) return value.slice("refs/heads/".length);
    if (value.startsWith("refs/remotes/")) return value.slice("refs/remotes/".length);
    if (value === targetCommit) return shortSha(targetCommit);
    return value;
  }
  if (sourceBranch) return sourceBranch;
  if (isCommitTarget && targetCommit) return shortSha(targetCommit);
  return currentBranchName || "HEAD";
}
