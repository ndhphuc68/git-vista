import React, { useEffect, useState } from "react";
import { Play, PlayCircle, Trash2 } from "lucide-react";
import { type StashItem, type CommitDetails } from "../../ipc/bindings";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";

interface StashDiffViewProps {
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
  const { t, locale } = useTranslation();
  const [commitDetails, setCommitDetails] = useState<CommitDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCommitDetails(null);
    setError(null);

    invokeCommand
      .getCommitDetails(repoPath, stashItem.commit_id)
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
      {/* Action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-surface shrink-0">
        <button
          type="button"
          onClick={() => onApply(stashItem.index)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-border-subtle rounded-sm text-xs text-primary hover:bg-surface-hover cursor-pointer transition-colors"
          title={t.modals.stashDiff.applyTitle}
        >
          <Play size={12} className="text-accent" />
          <span>{t.modals.stashDiff.applyBtn}</span>
        </button>
        <button
          type="button"
          onClick={() => onPop(stashItem.index)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-border-subtle rounded-sm text-xs text-primary hover:bg-surface-hover cursor-pointer transition-colors"
          title={t.modals.stashDiff.popTitle}
        >
          <PlayCircle size={12} className="text-accent" />
          <span>{t.modals.stashDiff.popBtn}</span>
        </button>
        <button
          type="button"
          onClick={() => onDrop(stashItem.index)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-border-subtle rounded-sm text-xs text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer transition-colors"
          title={t.modals.stashDiff.dropTitle}
        >
          <Trash2 size={12} />
          <span>{t.modals.stashDiff.dropBtn}</span>
        </button>
      </div>

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

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <div className="p-3 text-xs text-secondary text-center">
            <p className="text-tertiary mb-1">{t.modals.stashDiff.loadError}</p>
            <p className="font-mono text-[10px] text-tertiary">
              {stashItem.commit_id.substring(0, 12)}
            </p>
          </div>
        ) : commitDetails ? (
          <div className="flex flex-col gap-0.5">
            {commitDetails.files.length === 0 ? (
              <div className="text-xs text-tertiary text-center py-4">
                {t.modals.stashDiff.emptyFiles}
              </div>
            ) : (
              commitDetails.files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-surface-hover text-xs"
                >
                  <span
                    className={
                      file.status === "deleted"
                        ? "text-diff-remove-text"
                        : file.status === "added"
                          ? "text-diff-add-text"
                          : "text-secondary"
                    }
                  >
                    {file.status === "deleted" ? "D" : file.status === "added" ? "A" : "M"}
                  </span>
                  <span className="text-primary truncate">{file.path}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-tertiary">
                    +{file.additions} -{file.deletions}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-xs text-tertiary text-center py-4">{t.common.loading}</div>
        )}
      </div>
    </div>
  );
};
