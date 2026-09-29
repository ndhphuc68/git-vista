import { Folder } from "lucide-react";
import { FileDiffViewer } from "./FileDiffViewer";
import { CommitFileDiffHeader } from "./CommitFileDiffHeader";
import { useTranslation } from "../../../i18n";
import type { CommitFile } from "../api/useCommitDetails";

interface CommitFileDiffProps {
  repoPath: string | undefined;
  selectedCommitId: string;
  selectedFile: CommitFile | null;
  fileCount: number;
  currentFileIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  handlePrevFile: () => void;
  handleNextFile: () => void;
  copiedFilePath: boolean;
  handleCopyFilePath: (path: string) => void;
}

export function CommitFileDiff({
  repoPath,
  selectedCommitId,
  selectedFile,
  fileCount,
  currentFileIndex,
  hasPrev,
  hasNext,
  handlePrevFile,
  handleNextFile,
  copiedFilePath,
  handleCopyFilePath,
}: CommitFileDiffProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
      {selectedFile && repoPath !== undefined ? (
        <>
          <CommitFileDiffHeader
            selectedFile={selectedFile}
            selectedCommitId={selectedCommitId}
            fileCount={fileCount}
            currentFileIndex={currentFileIndex}
            hasPrev={hasPrev}
            hasNext={hasNext}
            handlePrevFile={handlePrevFile}
            handleNextFile={handleNextFile}
            copiedFilePath={copiedFilePath}
            handleCopyFilePath={handleCopyFilePath}
          />

          {/* Code Diff Viewer Area */}
          <div className="flex-1 overflow-y-auto p-3">
            <FileDiffViewer
              repoPath={repoPath}
              commitId={selectedCommitId}
              filePath={selectedFile.path}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2">
          <Folder size={24} className="opacity-40" />
          <span>{t.diff.selectFilePrompt}</span>
        </div>
      )}
    </div>
  );
}
