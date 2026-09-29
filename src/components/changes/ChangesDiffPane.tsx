import React from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "../../i18n";
import { InteractiveDiffViewer } from "./InteractiveDiffViewer";
import { type SelectedWorkingFile } from "./StagingFileList";

export interface ChangesDiffPaneProps {
  repoPath: string;
  selectedFile: SelectedWorkingFile | null;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

/** The right column: the selected file's diff, or a hint when nothing is selected. */
export const ChangesDiffPane: React.FC<ChangesDiffPaneProps> = ({
  repoPath,
  selectedFile,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t.changes.diffViewerAria}
      data-testid="changes-diff-viewer"
      className="flex-1 h-full min-w-0 flex flex-col overflow-hidden"
    >
      {selectedFile ? (
        <InteractiveDiffViewer
          repoPath={repoPath}
          filePath={selectedFile.path}
          isStaged={selectedFile.is_staged}
          onStageHunk={onStageHunk}
          onUnstageHunk={onUnstageHunk}
          onStageLines={onStageLines}
          onUnstageLines={onUnstageLines}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-tertiary text-xs text-center p-4">
          <FileText size={36} className="text-tertiary" />
          <span>{t.changes.selectFileHint}</span>
        </div>
      )}
    </section>
  );
};
