import React from "react";
import { GitBranch, ArrowRight } from "lucide-react";
import { type RecentRepoEntry } from "../../../ipc/bindings.generated";
import { formatAbsoluteDate, useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { formatRelativeTime } from "../model/recentRepositories";
import { RecentRepositoryRowActions } from "./RecentRepositoryRowActions";

export interface RecentRepositoryRowProps {
  item: RecentRepoEntry;
  isPinned: boolean;
  copiedPath: string | null;
  onOpenRecent: (path: string) => void;
  onRemoveRecent: (path: string) => void;
  onCopyPath: (path: string) => void;
  onTogglePin: (path: string) => void;
}

/**
 * A single recent-repository row with its quick actions (copy, pin, remove).
 * Extracted from `RecentRepositoryList`'s list, keeping the same markup
 * verbatim.
 */
export const RecentRepositoryRow: React.FC<RecentRepositoryRowProps> = ({
  item,
  isPinned,
  copiedPath,
  onOpenRecent,
  onRemoveRecent,
  onCopyPath,
  onTogglePin,
}) => {
  const { t, locale } = useTranslation();
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const displayPath = item.path.replace(/^\\\\\?\\/, "");
  const relativeTime =
    dateFormat === "absolute" && item.last_opened_at_ms
      ? formatAbsoluteDate(item.last_opened_at_ms / 1000, locale)
      : formatRelativeTime(item.last_opened_at_ms, t.welcome);

  return (
    <div
      onClick={() => onOpenRecent(item.path)}
      className="group flex items-center justify-between p-3 rounded-xl bg-transparent hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all cursor-pointer gap-2.5"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-window border border-border-subtle flex items-center justify-center text-secondary group-hover:text-link group-hover:border-accent transition-colors shrink-0">
          <GitBranch size={15} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-primary group-hover:text-link transition-colors">
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

        <RecentRepositoryRowActions
          item={item}
          displayPath={displayPath}
          isPinned={isPinned}
          copiedPath={copiedPath}
          onRemoveRecent={onRemoveRecent}
          onCopyPath={onCopyPath}
          onTogglePin={onTogglePin}
        />

        <ArrowRight
          size={16}
          className="text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </div>
  );
};
