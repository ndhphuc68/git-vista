import React, { useEffect, useState } from "react";
import { type StashItem, type CommitDetails } from "../../../ipc/bindings.generated";
import { getCommitDetails } from "../../history";
import { useTranslation } from "../../../i18n";
import { StashActionBar } from "./StashActionBar";
import { StashFileList } from "./StashFileList";

export interface StashDiffViewProps {
  stashItem: StashItem;
  repoPath: string;
  onApply: (index: number) => void;
  onPop: (index: number) => void;
  onDrop: (index: number) => void;
}

export const StashDiffView: React.FC<StashDiffViewProps> = ({
  stashItem,
  repoPath,
  onApply,
  onPop,
  onDrop,
}) => {
  const { locale } = useTranslation();
  const [commitDetails, setCommitDetails] = useState<CommitDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCommitDetails(null);
    setError(null);

    getCommitDetails(repoPath, stashItem.commit_id)
      .then((details) => {
        if (!cancelled) setCommitDetails(details);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [repoPath, stashItem.commit_id]);

  const createdDate = new Date(stashItem.created_at * 1000).toLocaleString(
    locale === "vi" ? "vi-VN" : "en-US"
  );

  return (
    <div className="flex flex-col h-full">
      <StashActionBar
        stashIndex={stashItem.index}
        onApply={onApply}
        onPop={onPop}
        onDrop={onDrop}
      />

      {/* Stash info */}
      <div className="px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="text-xs font-semibold text-primary mb-0.5">
          stash@{"{"}
          {stashItem.index}
          {"}"}
        </div>
        <div className="text-xs text-secondary truncate">{stashItem.message}</div>
        <div className="text-[11px] text-tertiary mt-0.5">{createdDate}</div>
      </div>

      <StashFileList commitId={stashItem.commit_id} error={error} commitDetails={commitDetails} />
    </div>
  );
};
