const CHANGE_TYPE_BADGE_CLASS: Record<string, string> = {
  added: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  deleted: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};
const DEFAULT_CHANGE_TYPE_BADGE_CLASS =
  "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";

/** Maps a file-history change type ("added"/"deleted"/anything else) to its badge className. */
export function getChangeTypeBadgeClass(changeType: string): string {
  return CHANGE_TYPE_BADGE_CLASS[changeType] ?? DEFAULT_CHANGE_TYPE_BADGE_CLASS;
}
