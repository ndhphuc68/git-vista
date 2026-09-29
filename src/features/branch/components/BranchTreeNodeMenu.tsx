/**
 * The dropdown action menu for one local branch row: checkout, merge, rebase,
 * compare, rename and delete. Checkout/merge/rebase/compare are hidden for
 * the current HEAD branch.
 */
import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { BranchTreeNodeMenuSwitchActions } from "./BranchTreeNodeMenuSwitchActions";

export interface BranchTreeNodeMenuProps {
  branch: BranchItem;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onSetMenuBranch: (name: string | null) => void;
  onCheckout: (name: string) => void;
  onMerge: (name: string) => void;
  onRebase: (name: string) => void;
  onCompare: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
}

export const BranchTreeNodeMenu: React.FC<BranchTreeNodeMenuProps> = ({
  branch,
  menuRef,
  currentBranchName,
  onSetMenuBranch,
  onCheckout,
  onMerge,
  onRebase,
  onCompare,
  onRename,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {!branch.is_head && (
        <BranchTreeNodeMenuSwitchActions
          branchName={branch.name}
          currentBranchName={currentBranchName}
          onSetMenuBranch={onSetMenuBranch}
          onCheckout={onCheckout}
          onMerge={onMerge}
          onRebase={onRebase}
          onCompare={onCompare}
        />
      )}

      <button
        type="button"
        onClick={() => {
          onSetMenuBranch(null);
          onRename(branch.name);
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Edit3 size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.renameBranch}</span>
      </button>

      {!branch.is_head && (
        <button
          type="button"
          onClick={() => {
            onSetMenuBranch(null);
            onDelete(branch.name);
          }}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full whitespace-nowrap transition-colors"
        >
          <Trash2 size={14} className="shrink-0" />
          <span>{t.sidebar.deleteBranch}</span>
        </button>
      )}
    </div>
  );
};
