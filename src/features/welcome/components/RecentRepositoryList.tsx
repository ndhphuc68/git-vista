import React from "react";
import {
  Clock,
  Search,
  X,
  Trash2,
  FolderOpen,
  GitBranch,
  Copy,
  Check,
  Star,
  ArrowRight,
} from "lucide-react";
import { type RecentRepoEntry } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";

/**
 * Formats a friendly relative time in the active language.
 */
function formatRelativeTime(
  timestampMs: number | undefined,
  t: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  }
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
      {/* Section Header with Search Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle flex-wrap">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-accent" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
            {t.welcome.recentTitle}
          </span>
          {recents.length > 0 && (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-window text-secondary border border-border-subtle">
              {sortedRecents.length}/{recents.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-sm justify-end">
          {/* Search input if recents exist */}
          {recents.length > 0 && (
            <div className="relative w-full max-w-[220px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
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

          {recents.length > 0 && (
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
          {sortedRecents.map((item) => {
            const displayPath = item.path.replace(/^\\\\\?\\/, "");
            const isPinned = pinnedPaths.includes(item.path);
            const relativeTime = formatRelativeTime(item.last_opened_at_ms, t.welcome);

            return (
              <div
                key={item.path}
                onClick={() => onOpenRecent(item.path)}
                className="group flex items-center justify-between p-3 rounded-xl bg-transparent hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all cursor-pointer gap-2.5"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-window border border-border-subtle flex items-center justify-center text-secondary group-hover:text-accent group-hover:border-accent transition-colors shrink-0">
                    <GitBranch size={15} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary group-hover:text-accent transition-colors">
                        {item.name}
                      </span>
                      {isPinned && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                          ⭐
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-tertiary truncate mt-0.5" title={displayPath}>
                      {displayPath}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {relativeTime && (
                    <span className="text-xs text-tertiary hidden sm:inline-block">{relativeTime}</span>
                  )}

                  {/* Quick action buttons on hover */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {/* Copy Path button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyPath(displayPath);
                      }}
                      className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent hover:bg-window text-secondary hover:text-primary transition-all cursor-pointer"
                      title={copiedPath === displayPath ? t.welcome.copied : t.welcome.copyPath}
                      aria-label={t.welcome.copyPath}
                    >
                      {copiedPath === displayPath ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    {/* Pin / Unpin button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(item.path);
                      }}
                      className={`flex items-center justify-center w-7 h-7 rounded-md bg-transparent hover:bg-window transition-all cursor-pointer ${
                        isPinned ? "text-amber-500" : "text-secondary hover:text-amber-500"
                      }`}
                      title={isPinned ? t.welcome.unpin : t.welcome.pin}
                      aria-label={isPinned ? t.welcome.unpin : t.welcome.pin}
                    >
                      <Star size={14} className={isPinned ? "fill-amber-500 text-amber-500" : ""} />
                    </button>

                    {/* Remove recent button */}
                    <button
                      type="button"
                      data-testid={`remove-recent-${item.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecent(item.path);
                      }}
                      className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-0 text-secondary hover:text-diff-remove-text hover:bg-window transition-all cursor-pointer"
                      title={t.welcome.removeRecentTooltip}
                      aria-label={`${t.welcome.removeRecentTooltip}: ${item.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
