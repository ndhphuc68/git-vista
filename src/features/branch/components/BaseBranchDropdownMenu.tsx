import React from "react";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { BaseBranchDropdownSections } from "./BaseBranchDropdownSections";
import { DropdownSearchInput } from "./DropdownSearchInput";

export interface BaseBranchDropdownMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  noBranchesFoundText?: string;
  commitPrefix: string;
  localLabel: string;
  remoteLabel: string;
  filteredCommit?: string | null;
  filteredLocal: BranchItem[];
  filteredRemote: BranchItem[];
  currentBranchName?: string | null;
  selectedValue: string;
  targetCommit?: string | null;
  onSelect: (refValue: string) => void;
}

/** Popover menu with search and grouped sections for BaseBranchSelect. */
export const BaseBranchDropdownMenu: React.FC<BaseBranchDropdownMenuProps> = ({
  menuRef,
  search,
  onSearchChange,
  searchPlaceholder = "Filter branches...",
  noBranchesFoundText = "No matching branches",
  commitPrefix,
  localLabel,
  remoteLabel,
  filteredCommit,
  filteredLocal,
  filteredRemote,
  currentBranchName,
  selectedValue,
  targetCommit,
  onSelect,
}) => (
  <div
    ref={menuRef}
    className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-subtle rounded-md shadow-2xl z-50 text-xs flex flex-col animate-fade-in overflow-hidden"
  >
    <DropdownSearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />

    <BaseBranchDropdownSections
      filteredCommit={filteredCommit}
      filteredLocal={filteredLocal}
      filteredRemote={filteredRemote}
      commitPrefix={commitPrefix}
      localLabel={localLabel}
      remoteLabel={remoteLabel}
      currentBranchName={currentBranchName}
      selectedValue={selectedValue}
      targetCommit={targetCommit}
      onSelect={onSelect}
      noBranchesFoundText={noBranchesFoundText}
    />
  </div>
);
