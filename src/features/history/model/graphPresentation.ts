import type { GraphCommitNode, RepoStatusResult } from "../../../ipc/bindings.generated";

const BRANCH_PALETTES = [
  {
    bg: "bg-blue-50/95 dark:bg-blue-950/50",
    border: "border-blue-300 dark:border-blue-700/80",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-purple-50/95 dark:bg-purple-950/50",
    border: "border-purple-300 dark:border-purple-700/80",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-emerald-50/95 dark:bg-emerald-950/50",
    border: "border-emerald-300 dark:border-emerald-700/80",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50/95 dark:bg-amber-950/50",
    border: "border-amber-300 dark:border-amber-700/80",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-50/95 dark:bg-rose-950/50",
    border: "border-rose-300 dark:border-rose-700/80",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-teal-50/95 dark:bg-teal-950/50",
    border: "border-teal-300 dark:border-teal-700/80",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  {
    bg: "bg-indigo-50/95 dark:bg-indigo-950/50",
    border: "border-indigo-300 dark:border-indigo-700/80",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  {
    bg: "bg-orange-50/95 dark:bg-orange-950/50",
    border: "border-orange-300 dark:border-orange-700/80",
    text: "text-orange-800 dark:text-orange-300",
    dot: "bg-orange-500",
  },
];

export function getBranchPillStyle(name: string, isHead: boolean, isTag: boolean) {
  if (isHead) {
    return {
      container: "bg-accent text-accent-contrast border-accent font-bold",
      dot: "bg-white",
      isHead: true,
    };
  }
  if (isTag) {
    return {
      container:
        "bg-amber-100/85 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 font-semibold",
      dot: "bg-amber-500",
      isHead: false,
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const palette = BRANCH_PALETTES[Math.abs(hash) % BRANCH_PALETTES.length]!;
  return {
    container: `${palette.bg} ${palette.text} ${palette.border} font-semibold`,
    dot: palette.dot,
    isHead: false,
  };
}

export interface UncommittedSummary {
  hasUncommittedChanges: boolean;
  modifiedCount: number;
  untrackedCount: number;
}

/** Working-tree WIP row summary derived from the repository status query. */
export function getUncommittedSummary(repoStatus: RepoStatusResult | undefined): UncommittedSummary {
  const hasUncommittedChanges = Boolean(
    repoStatus &&
      (repoStatus.staged.length > 0 ||
        repoStatus.unstaged.length > 0 ||
        repoStatus.untracked.length > 0)
  );
  const modifiedCount = (repoStatus?.staged.length || 0) + (repoStatus?.unstaged.length || 0);
  const untrackedCount = repoStatus?.untracked.length || 0;

  return { hasUncommittedChanges, modifiedCount, untrackedCount };
}

export function getMaxGraphColumns(commits: GraphCommitNode[]): number {
  let max = 3;
  for (const commit of commits) {
    max = Math.max(max, commit.col + 2);
    for (const line of commit.lines) {
      max = Math.max(max, line.from_col + 2, line.to_col + 2);
    }
  }
  return max;
}
