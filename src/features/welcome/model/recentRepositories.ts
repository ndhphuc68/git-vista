import { type RecentRepoEntry } from "../../../ipc/bindings.generated";

export interface RelativeTimeStrings {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}

/**
 * Formats a friendly relative time in the active language, e.g. "5 minutes
 * ago". Returns an empty string for a missing or invalid timestamp.
 */
export function formatRelativeTime(
  timestampMs: number | undefined,
  t: RelativeTimeStrings
): string {
  if (!timestampMs || isNaN(timestampMs)) return "";
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestampMs) / 1000));

  if (diffSec < 60) {
    return t.justNow;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return t.minutesAgo.replace("{m}", String(diffMin));
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return t.hoursAgo.replace("{h}", String(diffHour));
  }
  const diffDay = Math.floor(diffHour / 24);
  return t.daysAgo.replace("{d}", String(diffDay));
}

/**
 * Filters `repositories` by a case-insensitive match on name or path against
 * `searchQuery`, then sorts pinned entries first, and within each group by
 * descending `last_opened_at_ms`. Returns a new array; never mutates the
 * input.
 */
export function sortRecentRepositories(
  repositories: RecentRepoEntry[],
  pinnedPaths: string[],
  searchQuery: string
): RecentRepoEntry[] {
  let list = repositories;
  const query = searchQuery.toLowerCase().trim();
  if (query) {
    list = list.filter(
      (item) => item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)
    );
  }

  return [...list].sort((a, b) => {
    const aPinned = pinnedPaths.includes(a.path);
    const bPinned = pinnedPaths.includes(b.path);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return (b.last_opened_at_ms || 0) - (a.last_opened_at_ms || 0);
  });
}
