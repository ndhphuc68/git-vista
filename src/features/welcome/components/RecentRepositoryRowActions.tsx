import React from "react";
import { Copy, Check, Star, X } from "lucide-react";
import { type RecentRepoEntry } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";

export interface RecentRepositoryRowActionsProps {
  item: RecentRepoEntry;
  displayPath: string;
  isPinned: boolean;
  copiedPath: string | null;
  onRemoveRecent: (path: string) => void;
  onCopyPath: (path: string) => void;
  onTogglePin: (path: string) => void;
}

/**
 * Copy / pin / remove quick-action buttons shown on hover in a
 * `RecentRepositoryRow`. Extracted from the component body, keeping the
 * same markup verbatim.
 */
export const RecentRepositoryRowActions: React.FC<RecentRepositoryRowActionsProps> = ({
  item,
  displayPath,
  isPinned,
  copiedPath,
  onRemoveRecent,
  onCopyPath,
  onTogglePin,
}) => {
  const { t } = useTranslation();

  return (
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
  );
};
