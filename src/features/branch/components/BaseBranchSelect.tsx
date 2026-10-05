import React, { useMemo } from "react";
import { GitBranch } from "lucide-react";
import { type BranchItem } from "../../../ipc/bindings.generated";
import { Select, type SelectGroup, type FieldSize } from "../../../shared/ui";
import {
  baseBranchFallbackLabel,
  buildBaseBranchSections,
  type BaseBranchSection,
} from "../model/baseBranchOptions";

export interface BaseBranchSelectProps {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: FieldSize;
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

const BRANCH_ICON = <GitBranch size={13} className="text-secondary shrink-0" aria-hidden="true" />;

// "HEAD" is the Git ref name, not translated text.
const HEAD_BADGE = (
  <span className="text-[10px] text-link px-1.5 py-px bg-accent/10 rounded-xs font-semibold">
    HEAD
  </span>
);

function toGroups(
  sections: BaseBranchSection[],
  labels: Record<BaseBranchSection["kind"], string>
): SelectGroup[] {
  return sections.map((section) => ({
    label: labels[section.kind],
    options: section.entries.map((entry) => ({
      value: entry.value,
      label: entry.label,
      icon: BRANCH_ICON,
      badge: entry.isHead ? HEAD_BADGE : undefined,
    })),
  }));
}

/** Searchable dropdown for the branch or commit a new branch starts from. */
export const BaseBranchSelect: React.FC<BaseBranchSelectProps> = (props) => {
  const {
    value,
    isCommitTarget,
    targetCommit,
    localBranches,
    remoteBranches,
    currentBranchName,
    commitPrefix,
    localLabel,
    remoteLabel,
  } = props;
  const groups = useMemo(
    () =>
      toGroups(
        buildBaseBranchSections({
          value,
          isCommitTarget,
          targetCommit,
          localBranches,
          remoteBranches,
          currentBranchName,
        }),
        { commit: commitPrefix, local: localLabel, remote: remoteLabel }
      ),
    [
      value,
      isCommitTarget,
      targetCommit,
      localBranches,
      remoteBranches,
      currentBranchName,
      commitPrefix,
      localLabel,
      remoteLabel,
    ]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="base-branch-select" className="text-xs font-medium text-primary">
        {props.label}
      </label>
      <Select
        id="base-branch-select"
        aria-label={props.ariaLabel}
        value={props.value}
        onChange={props.onChange}
        options={groups}
        placeholder={baseBranchFallbackLabel(props)}
        disabled={props.disabled}
        size={props.size ?? "lg"}
        mono
        searchable
        searchPlaceholder={props.searchPlaceholder}
        emptyText={props.noBranchesFoundText}
      />
    </div>
  );
};
