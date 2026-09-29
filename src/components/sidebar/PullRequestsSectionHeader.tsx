import React, { type MouseEvent } from "react";
import { GitPullRequest, ChevronDown, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { type Translations } from "../../i18n/vi";

interface PullRequestsSectionHeaderProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  openCount: number;
  isLoading: boolean;
  onCreate: (e: MouseEvent) => void;
  onRefresh: (e: MouseEvent) => void;
  t: Translations;
}

/** Collapsible section header: title, open-PR count, new-PR and refresh buttons. */
export const PullRequestsSectionHeader: React.FC<PullRequestsSectionHeaderProps> = ({
  isOpen,
  onToggleOpen,
  openCount,
  isLoading,
  onCreate,
  onRefresh,
  t,
}) => (
  <div
    onClick={onToggleOpen}
    className="flex items-center justify-between p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors select-none group"
  >
    <div className="flex items-center gap-1.5 min-w-0">
      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      <GitPullRequest size={13} className="text-accent" />
      <span className="truncate">{t.pullRequests.title}</span>
      {openCount > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent/15 text-accent">
          {openCount}
        </span>
      )}
    </div>

    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        title={t.pullRequests.newPr}
        aria-label={t.pullRequests.newPr}
        onClick={onCreate}
        className="p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
      >
        <Plus size={13} />
      </button>
      <button
        type="button"
        title={t.pullRequests.refresh}
        aria-label={t.pullRequests.refresh}
        onClick={onRefresh}
        className="p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
      >
        <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
      </button>
    </div>
  </div>
);
