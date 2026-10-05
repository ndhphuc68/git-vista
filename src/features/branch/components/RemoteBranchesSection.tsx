/**
 * The collapsible REMOTES section header and body: title, count, the manage-
 * remotes and add-remote buttons, and the tree (or empty state) as children.
 */
import React from "react";
import { ChevronDown, ChevronRight, Cloud, Plus, Settings2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface RemoteBranchesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  isEmpty: boolean;
  onManageRemotes: () => void;
  onAddRemote: () => void;
  children: React.ReactNode;
}

export const RemoteBranchesSection: React.FC<RemoteBranchesSectionProps> = ({
  isOpen,
  onToggle,
  count,
  isEmpty,
  onManageRemotes,
  onAddRemote,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={t.sidebar.remotes}
          className="flex items-center gap-1.5 flex-1 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <Cloud size={13} />
          <span>
            {t.sidebar.remotes} ({count})
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={t.sidebar.manageRemotesTitle}
            aria-label={t.sidebar.manageRemotesTitle}
            onClick={(e) => {
              e.stopPropagation();
              onManageRemotes();
            }}
            className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-link hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
          >
            <Settings2 size={13} />
          </button>
          <button
            type="button"
            title={t.sidebar.addRemoteTitle}
            aria-label={t.sidebar.addRemoteTitle}
            onClick={(e) => {
              e.stopPropagation();
              onAddRemote();
            }}
            className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-link hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-0.5 mt-1">
          {isEmpty ? (
            <div className="px-2 py-1 text-xs text-tertiary italic">{t.sidebar.emptyRemotes}</div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};
