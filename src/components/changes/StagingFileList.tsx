import React, { useState } from "react";
import { type RepoStatusResult, type StatusFileItem } from "../../ipc/bindings.generated";
import { useSettingsStore } from "../../store/useSettingsStore";
import { DiscardConfirmModal } from "./DiscardConfirmModal";
import { resolveStagingLists, type SelectedWorkingFile } from "./stagingFileListHelpers";
import { StagedSection } from "./StagedSection";
import { ConflictedSection } from "./ConflictedSection";
import { ChangesSection } from "./ChangesSection";

export type { SelectedWorkingFile } from "./stagingFileListHelpers";

export interface StagingFileListProps {
  repoPath?: string;
  status?: RepoStatusResult;
  staged?: StatusFileItem[];
  unstaged?: StatusFileItem[];
  untracked?: StatusFileItem[];
  conflicted?: StatusFileItem[];
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onUnstageFile: (filePath: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onDiscardFile: (filePath: string) => void;
  onOpenConflictResolver?: (filePath: string) => void;
}

export const StagingFileList: React.FC<StagingFileListProps> = (props) => {
  const {
    selectedFile,
    onSelectFile,
    onStageFile,
    onUnstageFile,
    onStageAll,
    onUnstageAll,
    onDiscardFile,
    onOpenConflictResolver,
  } = props;
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const confirmDiscard = useSettingsStore((s) => s.confirmDiscard);

  // With the confirmation turned off in settings, discard straight away.
  const requestDiscard = (filePath: string) => {
    if (confirmDiscard) setDiscardTarget(filePath);
    else onDiscardFile(filePath);
  };

  const { stagedFiles, conflictedFiles, changesFiles } = resolveStagingLists(props);

  const handleConfirmDiscard = () => {
    if (discardTarget) {
      onDiscardFile(discardTarget);
      setDiscardTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface border-r border-border-subtle overflow-y-auto">
      <StagedSection
        stagedFiles={stagedFiles}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
        onUnstageFile={onUnstageFile}
        onUnstageAll={onUnstageAll}
      />

      {conflictedFiles.length > 0 && (
        <ConflictedSection
          conflictedFiles={conflictedFiles}
          onOpenConflictResolver={onOpenConflictResolver}
        />
      )}

      <ChangesSection
        changesFiles={changesFiles}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
        onStageFile={onStageFile}
        onSetDiscardTarget={requestDiscard}
        onStageAll={onStageAll}
      />

      {/* Discard Confirmation Modal */}
      <DiscardConfirmModal
        isOpen={Boolean(discardTarget)}
        filePath={discardTarget}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setDiscardTarget(null)}
      />
    </div>
  );
};
