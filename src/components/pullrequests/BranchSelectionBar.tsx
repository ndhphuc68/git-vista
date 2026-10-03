import React from "react";
import { GitBranch, ArrowRight } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { Select, type SelectOption } from "../../shared/ui";

const BRANCH_ICON = <GitBranch size={13} className="text-secondary shrink-0" aria-hidden="true" />;

function toOptions(branches: string[]): SelectOption[] {
  return branches.map((name) => ({ value: name, label: name, icon: BRANCH_ICON }));
}

interface BranchSelectionBarProps {
  baseBranch: string;
  onBaseBranchChange: (value: string) => void;
  availableBaseBranches: string[];
  compareBranch: string;
  onCompareBranchChange: (value: string) => void;
  availableCompareBranches: string[];
  submitting: boolean;
  t: Translations;
}

/** Branch selection bar: base branch, arrow, compare branch. */
export const BranchSelectionBar: React.FC<BranchSelectionBarProps> = ({
  baseBranch,
  onBaseBranchChange,
  availableBaseBranches,
  compareBranch,
  onCompareBranchChange,
  availableCompareBranches,
  submitting,
  t,
}) => (
  <div className="p-3 bg-window rounded-lg border border-border-subtle flex flex-col sm:flex-row items-center gap-3">
    <div className="flex-1 w-full">
      <label
        htmlFor="base-branch-select"
        className="block text-[11px] font-medium text-secondary mb-1"
      >
        {t.pullRequests.baseBranch}
      </label>
      <Select
        id="base-branch-select"
        aria-label={t.pullRequests.baseBranch}
        value={baseBranch}
        onChange={onBaseBranchChange}
        options={toOptions(availableBaseBranches)}
        disabled={submitting}
        mono
        searchable
        searchPlaceholder={t.pullRequests.searchBranchPlaceholder}
        emptyText={t.pullRequests.noBranchesFound}
      />
    </div>

    <div className="flex items-center justify-center shrink-0 pt-3 sm:pt-4 text-secondary">
      <ArrowRight size={16} />
    </div>

    <div className="flex-1 w-full">
      <label
        htmlFor="compare-branch-select"
        className="block text-[11px] font-medium text-secondary mb-1"
      >
        {t.pullRequests.compareBranch}
      </label>
      <Select
        id="compare-branch-select"
        aria-label={t.pullRequests.compareBranch}
        value={compareBranch}
        onChange={onCompareBranchChange}
        options={toOptions(availableCompareBranches)}
        disabled={submitting}
        mono
        searchable
        searchPlaceholder={t.pullRequests.searchBranchPlaceholder}
        emptyText={t.pullRequests.noBranchesFound}
      />
    </div>
  </div>
);
