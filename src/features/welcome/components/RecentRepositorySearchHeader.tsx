import React from "react";
import { Clock, Search, X, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface RecentRepositorySearchHeaderProps {
  recentsCount: number;
  sortedCount: number;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onClearRecents: () => void;
}

/**
 * Section header with title, filtered/total count badge, search input and
 * clear-recents button for `RecentRepositoryList`. Extracted from the
 * component body, keeping the same markup verbatim.
 */
export const RecentRepositorySearchHeader: React.FC<RecentRepositorySearchHeaderProps> = ({
  recentsCount,
  sortedCount,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  onClearRecents,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle flex-wrap">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-accent" />
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
          {t.welcome.recentTitle}
        </span>
        {recentsCount > 0 && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-window text-secondary border border-border-subtle">
            {sortedCount}/{recentsCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-1 max-w-sm justify-end">
        {/* Search input if recents exist */}
        {recentsCount > 0 && (
          <div className="relative w-full max-w-[220px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={t.welcome.filterPlaceholder}
              aria-label={t.welcome.filterAria}
              className="w-full text-xs sm:text-sm pl-8 pr-7 py-1.5 bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary bg-transparent border-0 cursor-pointer p-0.5"
                title={t.welcome.clearSearch}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {recentsCount > 0 && (
          <button
            type="button"
            data-testid="clear-recents-btn"
            onClick={onClearRecents}
            className="flex items-center gap-1.5 text-tertiary text-xs sm:text-sm cursor-pointer bg-transparent border border-transparent hover:border-border-subtle px-2.5 py-1 rounded-lg hover:text-diff-remove-text hover:bg-surface-hover transition-colors shrink-0"
            title={t.welcome.clearRecentsTooltip}
          >
            <Trash2 size={13} />
            <span>{t.welcome.clearRecents}</span>
          </button>
        )}
      </div>
    </div>
  );
};
