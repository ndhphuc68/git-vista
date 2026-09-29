import React from "react";
import { GitCommit } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useCommitDetailPanelState } from "../hooks/useCommitDetailPanelState";
import { CommitDetailPanelHeader } from "./CommitDetailPanelHeader";
import { CommitDetailPanelBody } from "./CommitDetailPanelBody";

interface CommitDetailPanelProps {
  onClose?: () => void;
}

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    currentRepo,
    selectedCommitId,
    selectedFilePath,
    setSelectedFile,
    details,
    isLoading,
    navigation,
    copiedSha,
    copiedFilePath,
    filesWidth,
    setFilesWidth,
    handleClose,
    handleCopySha,
    handleCopyFilePath,
    handleResizeMouseDown,
  } = useCommitDetailPanelState(onClose);

  if (!selectedCommitId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2 p-6">
        <GitCommit size={28} className="opacity-40" />
        <span className="font-medium">{t.diff.selectCommitPrompt}</span>
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-3 h-full">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{t.diff.loadingCommitDetails}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-hidden select-none">
      <CommitDetailPanelHeader
        details={details}
        copiedSha={copiedSha}
        handleCopySha={handleCopySha}
        handleClose={handleClose}
      />

      <CommitDetailPanelBody
        details={details}
        repoPath={currentRepo?.path}
        selectedCommitId={selectedCommitId}
        selectedFilePath={selectedFilePath}
        setSelectedFile={setSelectedFile}
        filesWidth={filesWidth}
        setFilesWidth={setFilesWidth}
        handleResizeMouseDown={handleResizeMouseDown}
        copiedFilePath={copiedFilePath}
        handleCopyFilePath={handleCopyFilePath}
        navigation={navigation}
      />
    </div>
  );
};
