import React from "react";
import { GitBranch, ArrowRight } from "lucide-react";
import { type Translations } from "../../i18n/vi";

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
      <div className="relative">
        <select
          id="base-branch-select"
          aria-label={t.pullRequests.baseBranch}
          value={baseBranch}
          onChange={(e) => onBaseBranchChange(e.target.value)}
          disabled={submitting}
          className="w-full bg-surface text-primary border border-border-subtle rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-accent transition-colors cursor-pointer appearance-none pr-8"
        >
          {availableBaseBranches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <GitBranch
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
        />
      </div>
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
      <div className="relative">
        <select
          id="compare-branch-select"
          aria-label={t.pullRequests.compareBranch}
          value={compareBranch}
          onChange={(e) => onCompareBranchChange(e.target.value)}
          disabled={submitting}
          className="w-full bg-surface text-primary border border-border-subtle rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-accent transition-colors cursor-pointer appearance-none pr-8"
        >
          {availableCompareBranches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <GitBranch
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
        />
      </div>
    </div>
  </div>
);
