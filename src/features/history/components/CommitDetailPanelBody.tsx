import type { MouseEvent } from "react";
import { useTranslation } from "../../../i18n";
import type { CommitDetails, CommitFile } from "../api/useCommitDetails";
import { CommitMetadata } from "./CommitMetadata";
import { CommitFileList } from "./CommitFileList";
import { CommitFileDiff } from "./CommitFileDiff";

interface CommitDetailPanelBodyProps {
  details: CommitDetails;
  repoPath: string | undefined;
  selectedCommitId: string;
  selectedFilePath: string | null;
  setSelectedFile: (path: string) => void;
  filesWidth: number;
  setFilesWidth: (width: number) => void;
  handleResizeMouseDown: (e: MouseEvent) => void;
  copiedFilePath: boolean;
  handleCopyFilePath: (path: string) => void;
  navigation: {
    filteredFiles: CommitFile[];
    fileFilter: string;
    setFileFilter: (filter: string) => void;
    selectedFile: CommitFile | null;
    currentFileIndex: number;
    hasPrev: boolean;
    hasNext: boolean;
    handlePrevFile: () => void;
    handleNextFile: () => void;
  };
}

/** 2-column split below the header: metadata + file list on the left, diff viewer on the right. */
export function CommitDetailPanelBody({
  details,
  repoPath,
  selectedCommitId,
  selectedFilePath,
  setSelectedFile,
  filesWidth,
  setFilesWidth,
  handleResizeMouseDown,
  copiedFilePath,
  handleCopyFilePath,
  navigation,
}: CommitDetailPanelBodyProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column: Commit Summary & File List */}
      <div
        style={{ width: `${filesWidth}px` }}
        className="border-r border-border-subtle bg-window flex flex-col shrink-0 overflow-hidden"
      >
        <CommitMetadata details={details} />
        <CommitFileList
          files={details.files}
          filteredFiles={navigation.filteredFiles}
          fileFilter={navigation.fileFilter}
          setFileFilter={navigation.setFileFilter}
          selectedFilePath={selectedFilePath}
          setSelectedFile={setSelectedFile}
          selectedCommitId={selectedCommitId}
        />
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={() => setFilesWidth(340)}
        className="w-1 hover:w-1.5 -mr-0.5 h-full cursor-col-resize z-10 transition-all group shrink-0 relative select-none hover:bg-accent active:bg-accent border-r border-border-subtle hover:border-accent"
        title={t.diff.resizerTooltip}
      >
        <div className="w-full h-full" />
      </div>

      <CommitFileDiff
        repoPath={repoPath}
        selectedCommitId={selectedCommitId}
        selectedFile={navigation.selectedFile}
        fileCount={details.files.length}
        currentFileIndex={navigation.currentFileIndex}
        hasPrev={navigation.hasPrev}
        hasNext={navigation.hasNext}
        handlePrevFile={navigation.handlePrevFile}
        handleNextFile={navigation.handleNextFile}
        copiedFilePath={copiedFilePath}
        handleCopyFilePath={handleCopyFilePath}
      />
    </div>
  );
}
