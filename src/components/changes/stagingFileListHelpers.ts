import { type RepoStatusResult, type StatusFileItem, type FileStatus } from "../../ipc/bindings.generated";

export interface SelectedWorkingFile {
  path: string;
  is_staged: boolean;
}

export interface StatusBadge {
  label: string;
  className: string;
  title: string;
}

/** Maps a file status to its one-letter badge (label, colors, tooltip). */
export function getStatusBadge(
  status: FileStatus | "Untracked",
  badgeDict: Record<"conflicted" | "modified" | "untracked" | "deleted" | "renamed", string>
): StatusBadge {
  switch (status) {
    case "Conflicted":
      return {
        label: "C",
        className: "bg-diff-remove-bg text-diff-remove-text",
        title: badgeDict.conflicted,
      };
    case "Modified":
      return {
        label: "M",
        className: "bg-accent-subtle text-accent",
        title: badgeDict.modified,
      };
    case "New":
    case "Untracked":
      return {
        label: "U",
        className: "bg-diff-add-bg text-diff-add-text",
        title: badgeDict.untracked,
      };
    case "Deleted":
      return {
        label: "D",
        className: "bg-diff-remove-bg text-diff-remove-text",
        title: badgeDict.deleted,
      };
    case "Renamed":
      return {
        label: "R",
        className: "bg-accent-subtle text-accent",
        title: badgeDict.renamed,
      };
    default:
      return {
        label: "M",
        className: "bg-window text-secondary",
        title: String(status),
      };
  }
}

export type ChangedFileItem = StatusFileItem & { isUntracked?: boolean };

export interface StagingLists {
  stagedFiles: StatusFileItem[];
  conflictedFiles: StatusFileItem[];
  changesFiles: ChangedFileItem[];
}

export interface ListsSource {
  status?: RepoStatusResult;
  staged?: StatusFileItem[];
  unstaged?: StatusFileItem[];
  untracked?: StatusFileItem[];
  conflicted?: StatusFileItem[];
}

/**
 * Resolves the staged/conflicted/changes file lists from `StagingFileList`'s
 * props: explicit `staged`/`unstaged`/`untracked`/`conflicted` lists take
 * priority, falling back to the equivalent field of `status`.
 */
export function resolveStagingLists(props: ListsSource): StagingLists {
  const stagedFiles = props.staged ?? props.status?.staged ?? [];
  const unstagedFiles = props.unstaged ?? props.status?.unstaged ?? [];
  const untrackedFiles = props.untracked ?? props.status?.untracked ?? [];
  const conflictedFiles = props.conflicted ?? props.status?.conflicted ?? [];
  const changesFiles: ChangedFileItem[] = [
    ...unstagedFiles,
    ...untrackedFiles.map((u) => ({ ...u, isUntracked: true })),
  ];

  return { stagedFiles, conflictedFiles, changesFiles };
}

