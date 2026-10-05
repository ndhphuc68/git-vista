/**
 * The select button for a local branch leaf row: HEAD dot, name and
 * the HEAD badge. Split out of BranchLeafRow to keep that row's own function
 * under the line limit.
 */
import React from "react";
import clsx from "clsx";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";

export interface BranchSelectButtonProps {
  branch: BranchItem;
  name: string;
  isSelected: boolean;
  onSelectBranch: (name: string) => void;
}

export const BranchSelectButton: React.FC<BranchSelectButtonProps> = ({
  branch,
  name,
  isSelected,
  onSelectBranch,
}) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onSelectBranch(branch.name)}
      aria-selected={isSelected}
      className={clsx(
        "flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs transition-colors overflow-hidden",
        branch.is_head
          ? clsx(
              "text-link font-semibold",
              isSelected ? "bg-accent-subtle" : "bg-transparent hover:bg-surface-hover"
            )
          : clsx(
              "text-primary font-normal",
              isSelected ? "bg-surface-active" : "bg-transparent hover:bg-surface-hover"
            )
      )}
      title={
        branch.is_head
          ? `${branch.name} (HEAD)`
          : t.sidebar.checkoutBranchHint.replace("{name}", branch.name)
      }
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full shrink-0",
          branch.is_head ? "bg-accent" : "border border-tertiary bg-transparent"
        )}
      />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
      {branch.is_head && (
        <span className="text-[10px] text-link ml-auto shrink-0 px-1 py-0.2 bg-accent/10 rounded-xs font-semibold">
          HEAD
        </span>
      )}
    </button>
  );
};
