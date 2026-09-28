import { type RecentRepoEntry } from "../../../ipc/bindings.generated";

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
