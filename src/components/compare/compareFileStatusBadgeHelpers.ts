export interface StatusBadgeVisual {
  letter: string;
  className: string;
  title: string;
}

const ADDED_BADGE: StatusBadgeVisual = {
  letter: "A",
  className: "bg-diff-add-bg text-diff-add-text border border-diff-add-border",
  title: "Added",
};
const DELETED_BADGE: StatusBadgeVisual = {
  letter: "D",
  className: "bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border",
  title: "Deleted",
};
const RENAMED_BADGE: StatusBadgeVisual = {
  letter: "R",
  className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  title: "Renamed",
};
const MODIFIED_BADGE: StatusBadgeVisual = {
  letter: "M",
  className: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30",
  title: "Modified",
};

const STATUS_BADGES: Record<string, StatusBadgeVisual> = {
  added: ADDED_BADGE,
  new: ADDED_BADGE,
  deleted: DELETED_BADGE,
  renamed: RENAMED_BADGE,
};

/** Maps a compare file status string to its badge visuals. Falls back to "Modified". */
export function getFileStatusBadge(status: string): StatusBadgeVisual {
  return STATUS_BADGES[status.toLowerCase()] ?? MODIFIED_BADGE;
}
