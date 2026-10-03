import React from "react";
import { type BranchItem } from "../../../ipc/bindings.generated";

export interface BaseBranchHiddenSelectProps {
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
}

/** Accessible hidden native select for form and test compatibility. */
export const BaseBranchHiddenSelect: React.FC<BaseBranchHiddenSelectProps> = ({
  ariaLabel,
  value,
  onChange,
  disabled,
  isCommitTarget,
  targetCommit,
  sourceBranch,
  commitPrefix,
  localLabel,
  remoteLabel,
  localBranches,
  remoteBranches,
  currentBranchName,
}) => (
  <select
    id="base-branch-select"
    aria-label={ariaLabel}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="sr-only"
    tabIndex={-1}
  >
    {isCommitTarget && targetCommit && (
      <optgroup label={commitPrefix}>
        <option value={targetCommit}>
          {commitPrefix}: {targetCommit.substring(0, 7)}
        </option>
      </optgroup>
    )}
    <optgroup label={localLabel}>
      {localBranches.length === 0 && !isCommitTarget && (
        <option value="">{currentBranchName || "HEAD"}</option>
      )}
      {localBranches.map((branch) => {
        const isHead = branch.is_head || branch.name === currentBranchName;
        const optionValue = !targetCommit && isHead ? "" : `refs/heads/${branch.name}`;
        return (
          <option key={branch.name} value={optionValue}>
            {branch.name}
            {isHead ? " (HEAD)" : ""}
          </option>
        );
      })}
    </optgroup>
    {remoteBranches.length > 0 && (
      <optgroup label={remoteLabel}>
        {remoteBranches.map((branch) => (
          <option key={branch.name} value={`refs/remotes/${branch.name}`}>
            {branch.name}
          </option>
        ))}
      </optgroup>
    )}
    {sourceBranch &&
      !isCommitTarget &&
      !localBranches.some((b) => b.name === sourceBranch) &&
      !remoteBranches.some((b) => b.name === sourceBranch) && (
        <option value={value}>{sourceBranch}</option>
      )}
  </select>
);
