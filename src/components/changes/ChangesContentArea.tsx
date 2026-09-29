import React from "react";
import { type RepoStatusResult, type CommitDetails } from "../../ipc/bindings.generated";
import { ChangesSidebar } from "./ChangesSidebar";
import { ChangesDiffPane } from "./ChangesDiffPane";
import { type SelectedWorkingFile } from "./StagingFileList";

export interface ChangesContentAreaProps {
  showSidebar: boolean;
  showDiffViewer: boolean;
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
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

/** The sidebar/diff-pane row, each side toggled independently for the mobile switcher. */
export const ChangesContentArea: React.FC<ChangesContentAreaProps> = ({
  showSidebar,
  showDiffViewer,
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
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => (
  <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden">
    {/* Left Sidebar: Staging File List + Commit Box */}
    {showSidebar && (
      <ChangesSidebar
        repoPath={repoPath}
        isMobile={isMobile}
        isLaptop={isLaptop}
        status={status}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
        onStageFile={onStageFile}
        onUnstageFile={onUnstageFile}
        onStageAll={onStageAll}
        onUnstageAll={onUnstageAll}
        onDiscardFile={onDiscardFile}
        onOpenConflictResolver={onOpenConflictResolver}
        stagedCount={stagedCount}
        onCommit={onCommit}
        onCommitSuccess={onCommitSuccess}
        onSaveStashClick={onSaveStashClick}
      />
    )}

    {/* Right Area: Interactive Diff Viewer */}
    {showDiffViewer && (
      <ChangesDiffPane
        repoPath={repoPath}
        selectedFile={selectedFile}
        onStageHunk={onStageHunk}
        onUnstageHunk={onUnstageHunk}
        onStageLines={onStageLines}
        onUnstageLines={onUnstageLines}
      />
    )}
  </div>
);
