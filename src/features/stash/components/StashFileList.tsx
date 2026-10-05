import React from "react";
import { type CommitDetails } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { CHANGE_TYPE } from "../../../domain/enums";

export interface StashFileListProps {
  commitId: string;
  error: string | null;
  commitDetails: CommitDetails | null;
}

/**
 * File list body for a stash's diff: the load-error state, the empty-files
 * state, the loading state, and the per-file rows. Extracted from
 * `StashDiffView`, keeping the same markup verbatim.
 */
export const StashFileList: React.FC<StashFileListProps> = ({ commitId, error, commitDetails }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {error ? (
        <div className="p-3 text-xs text-secondary text-center">
          <p className="text-tertiary mb-1">{t.modals.stashDiff.loadError}</p>
          <p className="font-mono text-[10px] text-tertiary">{commitId.substring(0, 12)}</p>
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
                    file.status === CHANGE_TYPE.DELETED
                      ? "text-diff-remove-text"
                      : file.status === CHANGE_TYPE.ADDED
                        ? "text-diff-add-text"
                        : "text-secondary"
                  }
                >
                  {file.status === CHANGE_TYPE.DELETED
                    ? "D"
                    : file.status === CHANGE_TYPE.ADDED
                      ? "A"
                      : "M"}
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
  );
};
