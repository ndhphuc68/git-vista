/**
 * One local branch leaf row: the select/checkout button plus its "..." action
 * menu. Split out of BranchTreeNode so the folder/leaf dispatch stays small.
 */
import React from "react";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { BranchSelectButton } from "./BranchSelectButton";
import { BranchTreeNodeMenu } from "./BranchTreeNodeMenu";

export interface BranchLeafRowProps {
  branch: BranchItem;
  name: string;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  menuBranch: string | null;
  onSetMenuBranch: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  onMerge: (name: string) => void;
  onRebase: (name: string) => void;
  onCompare: (name: string) => void;
  onCreateBranchFrom: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
}

export const BranchLeafRow: React.FC<BranchLeafRowProps> = ({
  branch,
  name,
  selectedBranch,
  onSelectBranch,
  menuBranch,
  onSetMenuBranch,
  menuRef,
  currentBranchName,
  onCheckout,
  onMerge,
  onRebase,
  onCompare,
  onCreateBranchFrom,
  onRename,
  onDelete,
}) => {
  const isSelected = selectedBranch === branch.name;
  const isMenuOpen = menuBranch === branch.name;

  return (
    <div
      className={clsx(
        "group relative flex items-center justify-between rounded-sm",
        // Marks the row a right-click or "..." menu is acting on.
        isMenuOpen && "bg-surface-hover"
      )}
      onDoubleClick={() => {
        if (!branch.is_head) onCheckout(branch.name);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSetMenuBranch(branch.name);
      }}
    >
      <BranchSelectButton
        branch={branch}
        name={name}
        isSelected={isSelected}
        onSelectBranch={onSelectBranch}
      />

      {/* Three dots menu button */}
      <div
        className="relative shrink-0 flex items-center pr-1"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetMenuBranch(isMenuOpen ? null : branch.name);
          }}
          aria-label={`Menu thao tác nhánh ${branch.name}`}
          className={clsx(
            "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreVertical size={13} />
        </button>

        {isMenuOpen && (
          <BranchTreeNodeMenu
            branch={branch}
            menuRef={menuRef}
            currentBranchName={currentBranchName}
            onSetMenuBranch={onSetMenuBranch}
            onCheckout={onCheckout}
            onMerge={onMerge}
            onRebase={onRebase}
            onCompare={onCompare}
            onCreateBranchFrom={onCreateBranchFrom}
            onRename={onRename}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
};
