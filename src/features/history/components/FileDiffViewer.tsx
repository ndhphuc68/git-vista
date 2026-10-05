import React, { useState } from "react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useCommitFileDiff } from "../api/useFileInspection";
import { FileDiffToolbar } from "./FileDiffToolbar";
import { hunkKey } from "../../../shared/utils/listKeys";
import { ReadOnlyDiffHunk } from "../../../components/diff/ReadOnlyDiffHunk";

interface FileDiffViewerProps {
  repoPath: string;
  commitId: string;
  filePath: string;
}

export const FileDiffViewer: React.FC<FileDiffViewerProps> = ({ repoPath, commitId, filePath }) => {
  const { t } = useTranslation();
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();

  const { data: diff, isLoading } = useCommitFileDiff(
    repoPath,
    commitId,
    filePath,
    diffIgnoreWhitespace
  );

  if (isLoading) {
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-2 h-48">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.diff.readingDiff}</span>
      </div>
    );
  }

  const activeFilePath = diff?.file_path || filePath;

  const toolbar = (
    <FileDiffToolbar
      activeFilePath={activeFilePath}
      diff={diff}
      commitId={commitId}
      diffIgnoreWhitespace={diffIgnoreWhitespace}
      setDiffIgnoreWhitespace={setDiffIgnoreWhitespace}
      showWordDiff={showWordDiff}
      setShowWordDiff={setShowWordDiff}
    />
  );

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex flex-col font-mono text-xs overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-2xs">
        {toolbar}
        <div className="p-8 text-tertiary text-xs text-center">{t.diff.noTextChanges}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono text-xs overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-2xs">
      {toolbar}
      {diff.hunks.map((hunk) => (
        <ReadOnlyDiffHunk key={hunkKey(hunk)} hunk={hunk} showWordDiff={showWordDiff} />
      ))}
    </div>
  );
};
