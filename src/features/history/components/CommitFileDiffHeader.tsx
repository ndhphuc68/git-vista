import { CommitFileDiffHeaderInfo } from "./CommitFileDiffHeaderInfo";
import { CommitFileDiffHeaderNav } from "./CommitFileDiffHeaderNav";
import type { CommitFile } from "../api/useCommitDetails";

interface CommitFileDiffHeaderProps {
  selectedFile: CommitFile;
  selectedCommitId: string;
  fileCount: number;
  currentFileIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  handlePrevFile: () => void;
  handleNextFile: () => void;
  copiedFilePath: boolean;
  handleCopyFilePath: (path: string) => void;
}

/** Sticky header above the diff: file status/path/actions on the left, prev/next nav on the right. */
export function CommitFileDiffHeader({
  selectedFile,
  selectedCommitId,
  fileCount,
  currentFileIndex,
  hasPrev,
  hasNext,
  handlePrevFile,
  handleNextFile,
  copiedFilePath,
  handleCopyFilePath,
}: CommitFileDiffHeaderProps) {
  return (
    <div className="h-11 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
      <CommitFileDiffHeaderInfo
        selectedFile={selectedFile}
        selectedCommitId={selectedCommitId}
        copiedFilePath={copiedFilePath}
        handleCopyFilePath={handleCopyFilePath}
      />
      <CommitFileDiffHeaderNav
        fileCount={fileCount}
        currentFileIndex={currentFileIndex}
        hasPrev={hasPrev}
        hasNext={hasNext}
        handlePrevFile={handlePrevFile}
        handleNextFile={handleNextFile}
      />
    </div>
  );
}
