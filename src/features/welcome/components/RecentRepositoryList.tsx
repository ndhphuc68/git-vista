import React from "react";
import { FolderOpen } from "lucide-react";
import { type RecentRepoEntry } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { RecentRepositorySearchHeader } from "./RecentRepositorySearchHeader";
import { RecentRepositoryRow } from "./RecentRepositoryRow";

export interface RecentRepositoryListProps {
  recents: RecentRepoEntry[];
  sortedRecents: RecentRepoEntry[];
  isLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  pinnedPaths: string[];
  copiedPath: string | null;
  onOpenRecent: (path: string) => void;
  onClearRecents: () => void;
  onRemoveRecent: (path: string) => void;
  onCopyPath: (path: string) => void;
  onTogglePin: (path: string) => void;
}

/**
 * Search bar, empty/loading states, and the filtered & sorted list of recent
 * repositories with its per-item quick actions (copy, pin, remove). Moved
 * intact from the old `WelcomeScreen` component.
 */
export const RecentRepositoryList: React.FC<RecentRepositoryListProps> = ({
  recents,
  sortedRecents,
  isLoading,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  pinnedPaths,
  copiedPath,
  onOpenRecent,
  onClearRecents,
  onRemoveRecent,
  onCopyPath,
  onTogglePin,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs animate-slide-up">
      <RecentRepositorySearchHeader
        recentsCount={recents.length}
        sortedCount={sortedRecents.length}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        searchInputRef={searchInputRef}
        onClearRecents={onClearRecents}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="py-8 text-center text-xs sm:text-sm text-tertiary flex items-center justify-center gap-2.5">
          <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>{t.welcome.loading}</span>
        </div>
      ) : recents.length === 0 ? (
        /* Empty state when no recents exist */
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-window border border-border-subtle flex items-center justify-center text-tertiary mb-2.5">
            <FolderOpen size={22} />
          </div>
          <p className="text-sm font-medium text-secondary">{t.welcome.emptyRecentsTitle}</p>
          <p className="text-xs text-tertiary mt-1">{t.welcome.emptyRecentsDesc}</p>
        </div>
      ) : sortedRecents.length === 0 ? (
        /* Empty state when search produces no results */
        <div className="py-6 text-center text-xs sm:text-sm text-tertiary">
          {t.welcome.noMatch.replace("{query}", searchQuery)}
        </div>
      ) : (
        /* Filtered & Sorted recents list */
        <div className="flex flex-col gap-1.5 max-h-[290px] overflow-y-auto pr-1">
          {sortedRecents.map((item) => (
            <RecentRepositoryRow
              key={item.path}
              item={item}
              isPinned={pinnedPaths.includes(item.path)}
              copiedPath={copiedPath}
              onOpenRecent={onOpenRecent}
              onRemoveRecent={onRemoveRecent}
              onCopyPath={onCopyPath}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
};
