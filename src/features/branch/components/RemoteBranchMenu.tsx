/**
 * The dropdown action menu for a remote branch leaf: checkout, merge, rebase
 * and compare.
 */
import React from "react";
import { Check, GitMerge, GitCommit, GitCompare } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useKeepInView } from "../../../shared/hooks/useKeepInView";
import { type SidebarDialog } from "../model/sidebarDialog";

export interface RemoteBranchMenuProps {
  branchName: string;
  currentBranchName: string;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSetMenuBranch: (name: string | null) => void;
  onCheckout: (name: string) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const RemoteBranchMenu: React.FC<RemoteBranchMenuProps> = ({
  branchName,
  currentBranchName,
  menuRef,
  onSetMenuBranch,
  onCheckout,
  onOpenDialog,
}) => {
  const { t } = useTranslation();
  useKeepInView(menuRef);
  // The label embeds the current branch name, which can be arbitrarily long;
  // it is truncated in the menu and shown in full as a tooltip.
  const compareLabel = t.sidebar.compareWithCurrent.replace("{branch}", currentBranchName);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 min-w-56 w-max max-w-72 bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
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
          onOpenDialog({ kind: "merge", targetBranch: branchName });
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
          onOpenDialog({ kind: "rebase", upstreamBranch: branchName });
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
          onOpenDialog({ kind: "compare", baseRev: currentBranchName, targetRev: branchName });
        }}
        title={compareLabel}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <GitCompare size={14} className="text-secondary shrink-0" />
        <span className="min-w-0 truncate">{compareLabel}</span>
      </button>
    </div>
  );
};
