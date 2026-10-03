import React from "react";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { DropdownBranchItem } from "./DropdownBranchItem";

export interface BaseBranchDropdownSectionsProps {
  filteredCommit?: string | null;
  filteredLocal: BranchItem[];
  filteredRemote: BranchItem[];
  commitPrefix: string;
  localLabel: string;
  remoteLabel: string;
  currentBranchName?: string | null;
  selectedValue: string;
  targetCommit?: string | null;
  onSelect: (refValue: string) => void;
  noBranchesFoundText: string;
}

/** Grouped list sections for BaseBranchDropdownMenu. */
export const BaseBranchDropdownSections: React.FC<BaseBranchDropdownSectionsProps> = ({
  filteredCommit,
  filteredLocal,
  filteredRemote,
  commitPrefix,
  localLabel,
  remoteLabel,
  currentBranchName,
  selectedValue,
  targetCommit,
  onSelect,
  noBranchesFoundText,
}) => {
  const hasItems = Boolean(filteredCommit || filteredLocal.length > 0 || filteredRemote.length > 0);

  return (
    <div className="max-h-52 overflow-y-auto p-1 flex flex-col gap-0.5">
      {filteredCommit && (
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-secondary uppercase tracking-wider">
            {commitPrefix}
          </div>
          <DropdownBranchItem
            name={filteredCommit.substring(0, 7)}
            isSelected={selectedValue === filteredCommit}
            onClick={() => onSelect(filteredCommit)}
          />
        </div>
      )}

      {filteredLocal.length > 0 && (
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-secondary uppercase tracking-wider">
            {localLabel}
          </div>
          {filteredLocal.map((branch) => {
            const isHead = branch.is_head || branch.name === currentBranchName;
            const refValue = !targetCommit && isHead ? "" : `refs/heads/${branch.name}`;
            const isSelected =
              selectedValue === refValue || (!selectedValue && isHead && !targetCommit);

            return (
              <DropdownBranchItem
                key={branch.name}
                name={branch.name}
                isSelected={isSelected}
                isHead={isHead}
                onClick={() => onSelect(refValue)}
              />
            );
          })}
        </div>
      )}

      {filteredRemote.length > 0 && (
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-secondary uppercase tracking-wider">
            {remoteLabel}
          </div>
          {filteredRemote.map((branch) => (
            <DropdownBranchItem
              key={branch.name}
              name={branch.name}
              isSelected={selectedValue === `refs/remotes/${branch.name}`}
              onClick={() => onSelect(`refs/remotes/${branch.name}`)}
            />
          ))}
        </div>
      )}

      {!hasItems && (
        <div className="px-3 py-4 text-center text-xs text-secondary">{noBranchesFoundText}</div>
      )}
    </div>
  );
};
