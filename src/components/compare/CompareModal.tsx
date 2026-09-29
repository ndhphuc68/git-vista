import React from "react";
import { useTranslation } from "../../i18n";
import { useRepoStore } from "../../store/useRepoStore";
import { Modal } from "../../shared/ui";
import { CompareHeader } from "./CompareHeader";
import { CompareModalWorkspace } from "./CompareModalWorkspace";
import { useCompareModalState } from "./useCompareModalState";
import type { CompareMode } from "../../ipc/bindings.generated";

export interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath?: string;
  initialBaseRev?: string;
  initialTargetRev?: string;
  initialMode?: CompareMode;
  branches?: Array<{ name: string; is_head?: boolean }>;
  tags?: Array<{ name: string }>;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  repoPath: propRepoPath,
  initialBaseRev,
  initialTargetRev,
  initialMode = "MergeBase",
  branches = [],
  tags = [],
}) => {
  const { t } = useTranslation();
  const currentRepo = useRepoStore((s) => s.currentRepo);
  const repoPath = propRepoPath || currentRepo?.path || "";

  const {
    baseRev,
    setBaseRev,
    targetRev,
    setTargetRev,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    selectedFile,
    setSelectedFile,
    searchQuery,
    setSearchQuery,
    handleSwap,
    summary,
    isLoading,
  } = useCompareModalState({ repoPath, isOpen, initialBaseRev, initialTargetRev, initialMode });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      // The title lives inside CompareHeader with no id to point at, so this
      // names the dialog directly rather than via aria-labelledby.
      label={t.compare.title}
      // The original had no backdrop click handler at all: this dialog is a
      // working surface with unsaved revision inputs, so a stray click
      // outside must not discard it. Only the header's close button and
      // Escape dismiss it.
      closeOnBackdrop={false}
    >
      {/* Fixed 88vh and 6xl wide, both outside the MODAL_SIZE tiers: the
          two-pane diff body needs a definite height to scroll within. */}
      <div className="flex flex-col w-[90vw] max-w-6xl h-[88vh]">
        {/* Header with Base/Target inputs & Swap button & Mode toggle */}
        <CompareHeader
          baseRev={baseRev}
          targetRev={targetRev}
          mode={mode}
          onBaseRevChange={setBaseRev}
          onTargetRevChange={setTargetRev}
          onModeChange={setMode}
          onSwap={handleSwap}
          onClose={onClose}
          branches={branches}
          tags={tags}
          summary={summary}
          isLoading={isLoading}
        />

        <CompareModalWorkspace
          repoPath={repoPath}
          baseRev={baseRev}
          targetRev={targetRev}
          mode={mode}
          summary={summary}
          isLoading={isLoading}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </Modal>
  );
};
