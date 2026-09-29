/**
 * The checkout/merge/rebase/compare group of the branch action menu, shown
 * only for non-HEAD branches. Split out of BranchTreeNodeMenu to keep that
 * menu's own function under the line limit.
 */
import React from "react";
import { Check, GitMerge, GitCommit, GitCompare } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface BranchTreeNodeMenuSwitchActionsProps {
  branchName: string;
  currentBranchName: string;
  onSetMenuBranch: (name: string | null) => void;
  onCheckout: (name: string) => void;
  onMerge: (name: string) => void;
  onRebase: (name: string) => void;
  onCompare: (name: string) => void;
}

export const BranchTreeNodeMenuSwitchActions: React.FC<BranchTreeNodeMenuSwitchActionsProps> = ({
  branchName,
  currentBranchName,
  onSetMenuBranch,
  onCheckout,
  onMerge,
  onRebase,
  onCompare,
}) => {
  const { t } = useTranslation();
  // The label embeds the current branch name, which can be arbitrarily long;
  // it is truncated in the menu and shown in full as a tooltip.
  const compareLabel = t.sidebar.compareWithCurrent.replace("{branch}", currentBranchName);

  return (
    <>
      <button
        type="button"
        onClick={() => onCheckout(branchName)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Check size={14} className="text-accent shrink-0" />
        <span>{t.sidebar.checkoutBranch}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetMenuBranch(null);
          onMerge(branchName);
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <GitMerge size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.mergeIntoCurrent}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetMenuBranch(null);
          onRebase(branchName);
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <GitCommit size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.rebaseOntoThis}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetMenuBranch(null);
          onCompare(branchName);
        }}
        title={compareLabel}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <GitCompare size={14} className="text-secondary shrink-0" />
        <span className="min-w-0 truncate">{compareLabel}</span>
      </button>
    </>
  );
};
