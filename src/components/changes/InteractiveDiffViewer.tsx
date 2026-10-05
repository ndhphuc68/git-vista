import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useWorkingFileDiff } from "../../features/changes";
import { DiffViewerHeader } from "./DiffViewerHeader";
import { DiffViewerStatus } from "./DiffViewerStatus";
import { InteractiveHunk } from "./InteractiveHunk";
import { hunkKey } from "../../shared/utils/listKeys";
import { useDiffDisplaySettings } from "../diff/useDiffDisplaySettings";

export interface InteractiveDiffViewerProps {
  repoPath: string;
  filePath: string;
  isStaged: boolean;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

export const InteractiveDiffViewer: React.FC<InteractiveDiffViewerProps> = ({
  repoPath,
  filePath,
  isStaged,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => {
  const { t } = useTranslation();
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();
  const { style } = useDiffDisplaySettings();

  const {
    data: diff,
    isLoading,
    isError,
  } = useWorkingFileDiff(repoPath, filePath, isStaged, diffIgnoreWhitespace);

  if (isLoading) {
    return <DiffViewerStatus variant="loading" />;
  }

  if (isError || !diff) {
    return <DiffViewerStatus variant="error" />;
  }

  const isBinary = diff.status?.toLowerCase() === "binary";

  if (isBinary) {
    return <DiffViewerStatus variant="binary" />;
  }

  if (diff.hunks.length === 0) {
    return (
      <div className="flex flex-col h-full w-full bg-surface overflow-auto">
        <DiffViewerHeader
          diff={diff}
          isStaged={isStaged}
          showWordDiff={showWordDiff}
          setShowWordDiff={setShowWordDiff}
          diffIgnoreWhitespace={diffIgnoreWhitespace}
          setDiffIgnoreWhitespace={setDiffIgnoreWhitespace}
        />
        <div className="flex items-center justify-center flex-1 text-tertiary text-xs p-8">
          {t.diff.noDiffContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-auto">
      {/* File Diff Header */}
      <DiffViewerHeader
        diff={diff}
        isStaged={isStaged}
        showWordDiff={showWordDiff}
        setShowWordDiff={setShowWordDiff}
        diffIgnoreWhitespace={diffIgnoreWhitespace}
        setDiffIgnoreWhitespace={setDiffIgnoreWhitespace}
      />

      {/* Hunks list */}
      <div style={style} className="flex flex-col font-mono text-xs overflow-x-auto">
        {diff.hunks.map((hunk, hIdx) => (
          <InteractiveHunk
            key={hunkKey(hunk)}
            hunk={hunk}
            hIdx={hIdx}
            isStaged={isStaged}
            showWordDiff={showWordDiff}
            onStageHunk={onStageHunk}
            onUnstageHunk={onUnstageHunk}
            onStageLines={onStageLines}
            onUnstageLines={onUnstageLines}
          />
        ))}
      </div>
    </div>
  );
};
