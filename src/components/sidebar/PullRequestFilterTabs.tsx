import React from "react";
import clsx from "clsx";
import { type Translations } from "../../i18n/vi";
import { type PullRequestsFilterTab } from "./usePullRequestsSection";

interface PullRequestFilterTabsProps {
  filterTab: PullRequestsFilterTab;
  onFilterTabChange: (tab: PullRequestsFilterTab) => void;
  t: Translations;
}

/** Open/closed filter tabs for the pull requests list. */
export const PullRequestFilterTabs: React.FC<PullRequestFilterTabsProps> = ({
  filterTab,
  onFilterTabChange,
  t,
}) => (
  <div className="flex items-center gap-1 px-1 mb-1.5 text-[11px]">
    <button
      type="button"
      onClick={() => onFilterTabChange("open")}
      className={clsx(
        "px-2 py-0.5 rounded transition-colors cursor-pointer",
        filterTab === "open"
          ? "bg-accent/15 text-accent font-semibold"
          : "text-secondary hover:text-primary hover:bg-surface-hover"
      )}
    >
      {t.pullRequests.open}
    </button>
    <button
      type="button"
      onClick={() => onFilterTabChange("closed")}
      className={clsx(
        "px-2 py-0.5 rounded transition-colors cursor-pointer",
        filterTab === "closed"
          ? "bg-accent/15 text-accent font-semibold"
          : "text-secondary hover:text-primary hover:bg-surface-hover"
      )}
    >
      {t.pullRequests.closed}
    </button>
  </div>
);
