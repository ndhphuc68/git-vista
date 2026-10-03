import React from "react";
import clsx from "clsx";
import { Archive } from "lucide-react";
import { type RepoStatusResult, type CommitDetails } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { Button } from "../../shared/ui";
import { StagingFileList, type SelectedWorkingFile } from "./StagingFileList";
import { CommitBox } from "./CommitBox";

export interface ChangesSidebarProps {
  repoPath: string;
  isMobile: boolean;
  isLaptop: boolean;
  status: RepoStatusResult | undefined;
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onUnstageFile: (filePath: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onDiscardFile: (filePath: string) => void;
  onOpenConflictResolver: (filePath: string) => void;
  stagedCount: number;
  onCommit: (
    summary: string,
    description?: string,
    amend?: boolean
  ) => Promise<CommitDetails | void>;
  onCommitSuccess: () => void;
  onSaveStashClick: () => void;
}

/** The left column: staged/changes/conflicted file list, commit box, and stash button. */
export const ChangesSidebar: React.FC<ChangesSidebarProps> = ({
  repoPath,
  isMobile,
  isLaptop,
  status,
  selectedFile,
  onSelectFile,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onDiscardFile,
  onOpenConflictResolver,
  stagedCount,
  onCommit,
  onCommitSuccess,
  onSaveStashClick,
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t.changes.sidebarAria}
      data-testid="changes-sidebar"
      className={clsx(
        isMobile
          ? "w-full min-w-full max-w-full border-r-0"
          : isLaptop
            ? "w-70 min-w-65 max-w-95 border-r border-border-subtle"
            : "w-80 min-w-65 max-w-95 border-r border-border-subtle",
        "flex flex-col h-full bg-surface shrink-0"
      )}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <StagingFileList
          repoPath={repoPath}
          status={status || { staged: [], unstaged: [], untracked: [], conflicted: [] }}
          conflicted={status?.conflicted || []}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          onStageFile={onStageFile}
          onUnstageFile={onUnstageFile}
          onStageAll={onStageAll}
          onUnstageAll={onUnstageAll}
          onDiscardFile={onDiscardFile}
          onOpenConflictResolver={onOpenConflictResolver}
        />
      </div>

      <div className="shrink-0">
        <CommitBox
          repoPath={repoPath}
          stagedCount={stagedCount}
          onCommit={onCommit}
          onSuccess={onCommitSuccess}
        />
      </div>

      {/* Stash quick-save button */}
      <div className="shrink-0 px-3 py-2 border-t border-border-subtle">
        <Button variant="secondary" onClick={onSaveStashClick} className="w-full">
          <Archive size={12} />
          <span>{t.changes.saveStashBtn}</span>
        </Button>
      </div>
    </section>
  );
};
