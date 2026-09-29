/**
 * One remote branch leaf row: the select/checkout button plus its "..."
 * action menu. Always checks out on double click (unlike the local leaf,
 * which guards HEAD), and carries an aria-label the local leaf does not.
 */
import React from "react";
import clsx from "clsx";
import { Cloud, MoreVertical } from "lucide-react";
import { type SidebarDialog } from "../model/sidebarDialog";
import { RemoteBranchMenu } from "./RemoteBranchMenu";

export interface RemoteBranchRowProps {
  branchName: string;
  name: string;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  menuBranch: string | null;
  onSetMenuBranch: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const RemoteBranchRow: React.FC<RemoteBranchRowProps> = ({
  branchName,
  name,
  selectedBranch,
  onSelectBranch,
  menuBranch,
  onSetMenuBranch,
  menuRef,
  currentBranchName,
  onCheckout,
  onOpenDialog,
}) => {
  const isSelected = selectedBranch === branchName;
  const isMenuOpen = menuBranch === branchName;

  return (
    <div
      key={branchName}
      className="group relative flex items-center justify-between rounded-sm"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSetMenuBranch(branchName);
      }}
    >
      <button
        onClick={() => onSelectBranch(branchName)}
        onDoubleClick={() => onCheckout(branchName)}
        aria-selected={isSelected}
        aria-label={branchName}
        className={clsx(
          "flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs transition-colors overflow-hidden",
          isSelected
            ? "bg-accent-subtle text-accent font-semibold"
            : "bg-transparent text-primary hover:bg-surface-hover font-normal"
        )}
        title={branchName}
      >
        <Cloud size={11} className={clsx("shrink-0", isSelected ? "text-accent" : "text-tertiary")} />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
      </button>

      {/* Three dots action menu */}
      <div className="relative shrink-0 flex items-center pr-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetMenuBranch(isMenuOpen ? null : branchName);
          }}
          aria-label={`Menu thao tác nhánh ${branchName}`}
          className={clsx(
            "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreVertical size={13} />
        </button>

        {isMenuOpen && (
          <RemoteBranchMenu
            branchName={branchName}
            currentBranchName={currentBranchName}
            menuRef={menuRef}
            onSetMenuBranch={onSetMenuBranch}
            onCheckout={onCheckout}
            onOpenDialog={onOpenDialog}
          />
        )}
      </div>
    </div>
  );
};
