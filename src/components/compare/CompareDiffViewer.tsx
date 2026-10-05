import React, { useState } from "react";
import { FileCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useInspectorStore } from "../../store/useInspectorStore";
import { type CompareMode, type CompareFileItem } from "../../ipc/bindings.generated";
import { useCompareFileDiff } from "../../features/compare";
import { CompareDiffToolbar } from "./CompareDiffToolbar";
import { hunkKey } from "../../shared/utils/listKeys";
import { ReadOnlyDiffHunk } from "../diff/ReadOnlyDiffHunk";

export interface CompareDiffViewerProps {
  repoPath: string;
  baseRev: string;
  targetRev: string;
  file: CompareFileItem | null;
  mode: CompareMode;
}

export const CompareDiffViewer: React.FC<CompareDiffViewerProps> = ({
  repoPath,
  baseRev,
  targetRev,
  file,
  mode,
}) => {
  const { t } = useTranslation();
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();
  const { openInspector } = useInspectorStore();

  const filePath = file?.path ?? "";

  const { data: diff, isLoading } = useCompareFileDiff(repoPath, {
    baseRev,
    targetRev,
    filePath,
    mode,
    ignoreWhitespace: diffIgnoreWhitespace,
  });

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-tertiary text-xs gap-2 select-none">
        <FileCode size={28} className="opacity-30" />
        <span>{t.compare.selectFileToViewDiff}</span>
      </div>
    );
  }

  if (file.is_binary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-tertiary text-xs gap-2 select-none">
        <FileCode size={28} className="opacity-30" />
        <span>Tập tin nhị phân (Binary). Không thể hiển thị diff văn bản.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-secondary text-xs gap-2">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.diff.readingDiff}</span>
      </div>
    );
  }

  const toolbar = (
    <CompareDiffToolbar
      file={file}
      diff={diff}
      diffIgnoreWhitespace={diffIgnoreWhitespace}
      onToggleIgnoreWhitespace={() => setDiffIgnoreWhitespace(!diffIgnoreWhitespace)}
      showWordDiff={showWordDiff}
      onToggleWordDiff={() => setShowWordDiff(!showWordDiff)}
      onViewBlame={() => openInspector(file.path, "blame")}
      onViewHistory={() => openInspector(file.path, "history")}
    />
  );

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex flex-col h-full font-mono text-xs overflow-hidden bg-surface">
        {toolbar}
        <div className="flex-1 flex items-center justify-center p-8 text-tertiary text-xs text-center">
          {t.diff.noTextChanges}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden bg-surface">
      {toolbar}
      <div className="flex-1 overflow-y-auto">
        {diff.hunks.map((hunk) => (
          <ReadOnlyDiffHunk key={hunkKey(hunk)} hunk={hunk} showWordDiff={showWordDiff} />
        ))}
      </div>
    </div>
  );
};
