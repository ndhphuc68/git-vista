import React from "react";
import { useTranslation } from "../../../i18n";

export interface TagTargetCommitInfoProps {
  targetCommitId: string;
  targetCommitSummary?: string | null;
}

/**
 * Target commit SHA and summary line shown at the top of `CreateTagModal`.
 * Extracted from the component body, keeping the same markup verbatim.
 */
export const TagTargetCommitInfo: React.FC<TagTargetCommitInfoProps> = ({
  targetCommitId,
  targetCommitSummary,
}) => {
  const { t } = useTranslation();

  if (!targetCommitId) return null;

  return (
    <div className="text-[11px] text-secondary flex items-center gap-1 bg-window px-2.5 py-1.5 rounded-sm border border-border-subtle">
      <span>{t.modals.createTag.targetCommit}</span>
      <span className="font-mono text-primary font-semibold">{targetCommitId.substring(0, 7)}</span>
      {targetCommitSummary && (
        <span className="truncate text-secondary ml-1 max-w-[200px]" title={targetCommitSummary}>
          - {targetCommitSummary}
        </span>
      )}
    </div>
  );
};
