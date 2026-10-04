import React, { useMemo } from "react";
import clsx from "clsx";
import { RotateCw, Plus, Search, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";
import { PullRequestStatusBadge } from "./PullRequestStatusBadge";
import { filterPullRequests } from "../model/pullRequestFilter";
import type { GitHubPullRequest } from "../../../ipc/githubApi";
import type { PullRequestFilterState } from "../hooks/usePullRequestsScreen";

export interface PullRequestsMasterPaneProps {
  prs: GitHubPullRequest[];
  isLoading: boolean;
  filterState: PullRequestFilterState;
  onFilterChange: (state: PullRequestFilterState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPr: GitHubPullRequest | null;
  onSelectPr: (pr: GitHubPullRequest) => void;
  onRefresh: () => void;
  onNewPr: () => void;
  className?: string;
}

interface MasterPaneHeaderProps {
  title: string;
  refreshLabel: string;
  newPrLabel: string;
  onRefresh: () => void;
  onNewPr: () => void;
}

const MasterPaneHeader: React.FC<MasterPaneHeaderProps> = ({
  title,
  refreshLabel,
  newPrLabel,
  onRefresh,
  onNewPr,
}) => (
  <div className="p-4 pb-3 border-b border-border-subtle flex items-center justify-between gap-2">
    <h2 className="text-base font-semibold text-primary">{title}</h2>
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onRefresh}
        title={refreshLabel}
        aria-label={refreshLabel}
        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer border border-border-subtle"
      >
        <RotateCw size={14} />
      </button>
      <Button size="sm" variant="primary" onClick={onNewPr} className="gap-1">
        <Plus size={14} />
        <span>{newPrLabel}</span>
      </Button>
    </div>
  </div>
);

interface MasterPaneFilterControlsProps {
  filterState: PullRequestFilterState;
  onFilterChange: (state: PullRequestFilterState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  openLabel: string;
  closedLabel: string;
  allLabel: string;
  searchPlaceholder: string;
}

const MasterPaneFilterControls: React.FC<MasterPaneFilterControlsProps> = ({
  filterState,
  onFilterChange,
  searchQuery,
  onSearchChange,
  openLabel,
  closedLabel,
  allLabel,
  searchPlaceholder,
}) => (
  <div className="p-3 space-y-2 border-b border-border-subtle bg-surface/50">
    <div
      role="tablist"
      className="flex items-center gap-1 bg-surface-header/40 p-1 rounded-lg border border-border-subtle"
    >
      <button
        type="button"
        role="tab"
        aria-selected={filterState === "open"}
        onClick={() => onFilterChange("open")}
        className={clsx(
          "flex-1 py-1 px-2 text-xs rounded-md font-medium transition-colors text-center cursor-pointer",
          filterState === "open"
            ? "bg-surface text-primary shadow-xs border border-border-subtle font-semibold"
            : "text-secondary hover:text-primary"
        )}
      >
        {openLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={filterState === "closed"}
        onClick={() => onFilterChange("closed")}
        className={clsx(
          "flex-1 py-1 px-2 text-xs rounded-md font-medium transition-colors text-center cursor-pointer",
          filterState === "closed"
            ? "bg-surface text-primary shadow-xs border border-border-subtle font-semibold"
            : "text-secondary hover:text-primary"
        )}
      >
        {closedLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={filterState === "all"}
        onClick={() => onFilterChange("all")}
        className={clsx(
          "flex-1 py-1 px-2 text-xs rounded-md font-medium transition-colors text-center cursor-pointer",
          filterState === "all"
            ? "bg-surface text-primary shadow-xs border border-border-subtle font-semibold"
            : "text-secondary hover:text-primary"
        )}
      >
        {allLabel}
      </button>
    </div>

    <div className="relative">
      <Search
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-header/40 border border-border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-accent"
      />
    </div>
  </div>
);

const MasterPaneItem: React.FC<{
  pr: GitHubPullRequest;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ pr, isSelected, onSelect }) => (
  <button
    type="button"
    role="listitem"
    onClick={onSelect}
    className={clsx(
      "w-full text-left p-3.5 flex flex-col gap-2 transition-colors cursor-pointer border-l-2",
      isSelected
        ? "bg-surface-hover border-accent"
        : "border-transparent hover:bg-surface-hover/50"
    )}
  >
    <div className="flex items-center justify-between gap-2 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <PullRequestStatusBadge pr={pr} size="sm" />
        <span className="text-secondary font-mono text-xs shrink-0">#{pr.number}</span>
      </div>
      <span className="text-[11px] text-tertiary truncate">@{pr.user.login}</span>
    </div>

    <div className="text-sm font-medium text-primary truncate" title={pr.title}>
      {pr.title}
    </div>

    <div className="flex items-center gap-1.5 text-[11px] font-mono text-secondary truncate">
      <span className="text-primary truncate font-medium">{pr.head.ref}</span>
      <ArrowRight size={11} className="text-tertiary shrink-0" />
      <span className="text-secondary truncate">{pr.base.ref}</span>
    </div>
  </button>
);

export const PullRequestsMasterPane: React.FC<PullRequestsMasterPaneProps> = ({
  prs,
  isLoading,
  filterState,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedPr,
  onSelectPr,
  onRefresh,
  onNewPr,
  className,
}) => {
  const { t } = useTranslation();
  const filteredPrs = useMemo(
    () => filterPullRequests(prs, searchQuery),
    [prs, searchQuery]
  );

  return (
    <aside
      className={clsx(
        "w-80 md:w-96 shrink-0 border-r border-border-subtle bg-surface flex flex-col h-full",
        className
      )}
    >
      <MasterPaneHeader
        title={t.pullRequestsScreen.title}
        refreshLabel={t.pullRequestsScreen.refresh}
        newPrLabel={t.pullRequestsScreen.newPr}
        onRefresh={onRefresh}
        onNewPr={onNewPr}
      />

      <MasterPaneFilterControls
        filterState={filterState}
        onFilterChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        openLabel={t.pullRequestsScreen.openTab}
        closedLabel={t.pullRequestsScreen.closedTab}
        allLabel={t.pullRequestsScreen.allTab}
        searchPlaceholder={t.pullRequestsScreen.searchPlaceholder}
      />

      <div
        role="list"
        aria-label={t.pullRequestsScreen.title}
        className="flex-1 overflow-y-auto divide-y divide-border-subtle"
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-secondary">
            <Loader2 size={20} className="animate-spin text-accent" />
          </div>
        ) : filteredPrs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-secondary">
            <p className="text-xs">{t.pullRequestsScreen.emptyList}</p>
          </div>
        ) : (
          filteredPrs.map((pr) => (
            <MasterPaneItem
              key={pr.number}
              pr={pr}
              isSelected={selectedPr?.number === pr.number}
              onSelect={() => onSelectPr(pr)}
            />
          ))
        )}
      </div>
    </aside>
  );
};
