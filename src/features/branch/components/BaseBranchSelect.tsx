import React from "react";
import clsx from "clsx";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { useBaseBranchSelect } from "../hooks/useBaseBranchSelect";
import { BaseBranchDropdownMenu } from "./BaseBranchDropdownMenu";
import { BaseBranchTrigger } from "./BaseBranchTrigger";
import { BaseBranchHiddenSelect } from "./BaseBranchHiddenSelect";

export interface BaseBranchSelectProps {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  isCommitTarget?: boolean;
  targetCommit?: string | null;
  sourceBranch?: string;
  commitPrefix: string;
  localLabel: string;
  remoteLabel: string;
  localBranches: BranchItem[];
  remoteBranches: BranchItem[];
  currentBranchName?: string | null;
  searchPlaceholder?: string;
  noBranchesFoundText?: string;
}

/** Custom dropdown selector for base branch or commit matching GitVista design system. */
export const BaseBranchSelect: React.FC<BaseBranchSelectProps> = (props) => {
  const {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    containerRef,
    menuRef,
    filteredLocal,
    filteredRemote,
    filteredCommit,
    displayLabel,
    isHeadSelected,
    handleSelect,
  } = useBaseBranchSelect(props);

  return (
    <div ref={containerRef} className={clsx("flex flex-col gap-1.5 relative", isOpen && "z-40")}>
      <label htmlFor="base-branch-select" className="text-xs font-medium text-primary">
        {props.label}
      </label>

      <BaseBranchHiddenSelect {...props} />

      <BaseBranchTrigger
        isOpen={isOpen}
        onToggle={() => !props.disabled && setIsOpen((prev) => !prev)}
        disabled={props.disabled}
        displayLabel={displayLabel}
        isHeadSelected={isHeadSelected}
      />

      {isOpen && (
        <BaseBranchDropdownMenu
          menuRef={menuRef}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={props.searchPlaceholder}
          noBranchesFoundText={props.noBranchesFoundText}
          commitPrefix={props.commitPrefix}
          localLabel={props.localLabel}
          remoteLabel={props.remoteLabel}
          filteredCommit={filteredCommit}
          filteredLocal={filteredLocal}
          filteredRemote={filteredRemote}
          currentBranchName={props.currentBranchName}
          selectedValue={props.value}
          targetCommit={props.targetCommit}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
};
