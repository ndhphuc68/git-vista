import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Archive } from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useViewStore } from "../../store/useViewStore";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import { invokeCommand } from "../../ipc/client";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { StagingFileList, type SelectedWorkingFile } from "./StagingFileList";
import { CommitBox } from "./CommitBox";
import { InteractiveDiffViewer } from "./InteractiveDiffViewer";
import { CreateStashModal } from "../stash/CreateStashModal";
import { useTranslation } from "../../i18n";

export const ChangesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { currentRepo } = useRepoStore();
  const { sidebarOpen, activeChangesView, setActiveChangesView } = useLayoutStore();
  const { openConflictResolver } = useViewStore();
  const { isMobile, isLaptop } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<SelectedWorkingFile | null>(null);
  const [showCreateStash, setShowCreateStash] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["repoStatus", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo?.path),
  });

  // Auto-select first available file if none is selected or previous file disappeared
  useEffect(() => {
    if (!status) return;

    const allFiles: SelectedWorkingFile[] = [
      ...status.staged.map((f) => ({ path: f.path, is_staged: true })),
      ...status.unstaged.map((f) => ({ path: f.path, is_staged: false })),
      ...status.untracked.map((f) => ({ path: f.path, is_staged: false })),
    ];

    if (allFiles.length === 0) {
      setSelectedFile(null);
      return;
    }

    const stillExists =
      selectedFile &&
      allFiles.some((f) => f.path === selectedFile.path && f.is_staged === selectedFile.is_staged);
    if (!stillExists) {
      const first = allFiles[0];
      if (first) {
        setSelectedFile(first);
      }
    }
  }, [status, selectedFile]);

  if (!currentRepo) {
    return (
      <div className="flex items-center justify-center h-full text-tertiary text-xs">
        {t.changes.noRepoOpen}
      </div>
    );
  }

  const stagedCount = status?.staged?.length ?? 0;

  const handleSelectFile = (file: SelectedWorkingFile) => {
    setSelectedFile(file);
    if (isMobile) {
      setActiveChangesView("diff");
    }
  };

  const handleStageFile = async (filePath: string) => {
    await invokeCommand.stageFile(currentRepo.path, filePath);
    setSelectedFile({ path: filePath, is_staged: true });
    await queryClient.invalidateQueries();
  };

  const handleUnstageFile = async (filePath: string) => {
    await invokeCommand.unstageFile(currentRepo.path, filePath);
    setSelectedFile({ path: filePath, is_staged: false });
    await queryClient.invalidateQueries();
  };

  const handleStageAll = async () => {
    await invokeCommand.stageAll(currentRepo.path);
    await queryClient.invalidateQueries();
  };

  const handleUnstageAll = async () => {
    await invokeCommand.unstageAll(currentRepo.path);
    await queryClient.invalidateQueries();
  };

  const handleDiscardFile = async (filePath: string) => {
    try {
      const repoPath = currentRepo.path;
      const token = await invokeCommand.discardFileChanges(repoPath, filePath);
      useToastStore.getState().showToast({
        type: "success",
        message: t.discard.success.replace("{path}", filePath),
        durationMs: 10000,
        undoAction: async () => {
          await invokeCommand.restoreDiscard(repoPath, token);
          await queryClient.invalidateQueries();
        },
      });
      await queryClient.invalidateQueries();
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  const handleStageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return;
    await invokeCommand.stageHunk(currentRepo.path, selectedFile.path, hunkIndex, false);
    await queryClient.invalidateQueries();
  };

  const handleUnstageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return;
    await invokeCommand.stageHunk(currentRepo.path, selectedFile.path, hunkIndex, true);
    await queryClient.invalidateQueries();
  };

  const handleStageLines = async (hunkIndex: number, lineIndices: number[]) => {
    if (!selectedFile) return;
    await invokeCommand.stageLines(
      currentRepo.path,
      selectedFile.path,
      hunkIndex,
      lineIndices,
      false
    );
    await queryClient.invalidateQueries();
  };

  const handleUnstageLines = async (hunkIndex: number, lineIndices: number[]) => {
    if (!selectedFile) return;
    await invokeCommand.stageLines(
      currentRepo.path,
      selectedFile.path,
      hunkIndex,
      lineIndices,
      true
    );
    await queryClient.invalidateQueries();
  };

  const handleCommit = async (summary: string, description?: string, amend?: boolean) => {
    const result = await invokeCommand.createCommit(currentRepo.path, summary, description, amend);
    await queryClient.invalidateQueries();
    return result;
  };

  const showSidebar = isMobile ? activeChangesView !== "diff" : sidebarOpen;
  const showDiffViewer = isMobile ? activeChangesView !== "files" : true;

  return (
    <main
      data-testid="changes-screen-main"
      className="flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden bg-surface"
    >
      {/* Mobile view switcher tab */}
      {isMobile && (
        <div
          data-testid="mobile-changes-switcher"
          className="flex items-center p-1 bg-window border-b border-border-subtle gap-1 shrink-0"
        >
          <button
            type="button"
            data-testid="mobile-tab-files"
            onClick={() => setActiveChangesView("files")}
            className={clsx(
              "flex-1 py-1 px-2 rounded-sm text-xs cursor-pointer text-center",
              activeChangesView === "files"
                ? "bg-surface text-primary shadow-sm font-semibold"
                : "bg-transparent text-secondary font-normal"
            )}
          >
            {t.changes.mobileTabFiles.replace(
              "{count}",
              String(
                status
                  ? status.staged.length +
                      status.unstaged.length +
                      status.untracked.length +
                      (status.conflicted?.length || 0)
                  : 0
              )
            )}
          </button>
          <button
            type="button"
            data-testid="mobile-tab-diff"
            onClick={() => setActiveChangesView("diff")}
            className={clsx(
              "flex-1 py-1 px-2 rounded-sm text-xs cursor-pointer text-center",
              activeChangesView === "diff"
                ? "bg-surface text-primary shadow-sm font-semibold"
                : "bg-transparent text-secondary font-normal"
            )}
          >
            {t.changes.mobileTabDiff}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden">
        {/* Left Sidebar: Staging File List + Commit Box */}
        {showSidebar && (
          <section
            aria-label={t.changes.sidebarAria}
            data-testid="changes-sidebar"
            className={clsx(
              isMobile
                ? "w-full min-w-full max-w-full border-r-0"
                : isLaptop
                  ? "w-70 min-w-65 max-w-95 border-r border-border-subtle"
                  : "w-80 min-w-65 max-w-95 border-r border-border-subtle",
              "flex flex-col h-full bg-surface shrink-0"
            )}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <StagingFileList
                repoPath={currentRepo.path}
                status={status || { staged: [], unstaged: [], untracked: [], conflicted: [] }}
                conflicted={status?.conflicted || []}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
                onDiscardFile={handleDiscardFile}
                onOpenConflictResolver={(filePath) => openConflictResolver(filePath)}
              />
            </div>

            <div className="shrink-0">
              <CommitBox
                repoPath={currentRepo.path}
                stagedCount={stagedCount}
                onCommit={handleCommit}
                onSuccess={() => {
                  void queryClient.invalidateQueries();
                }}
              />
            </div>

            {/* Stash quick-save button */}
            <div className="shrink-0 px-3 py-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowCreateStash(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs text-secondary hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <Archive size={12} />
                <span>{t.changes.saveStashBtn}</span>
              </button>
            </div>
          </section>
        )}

        {/* Right Area: Interactive Diff Viewer */}
        {showDiffViewer && (
          <section
            aria-label={t.changes.diffViewerAria}
            data-testid="changes-diff-viewer"
            className="flex-1 h-full min-w-0 flex flex-col overflow-hidden"
          >
            {selectedFile ? (
              <InteractiveDiffViewer
                repoPath={currentRepo.path}
                filePath={selectedFile.path}
                isStaged={selectedFile.is_staged}
                onStageHunk={handleStageHunk}
                onUnstageHunk={handleUnstageHunk}
                onStageLines={handleStageLines}
                onUnstageLines={handleUnstageLines}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-tertiary text-xs text-center p-4">
                <FileText size={36} className="text-tertiary" />
                <span>{t.changes.selectFileHint}</span>
              </div>
            )}
          </section>
        )}
      </div>

      <CreateStashModal
        isOpen={showCreateStash}
        onClose={() => setShowCreateStash(false)}
        repoPath={currentRepo.path}
        onSaveStash={async (message, includeUntracked) => {
          const id = await invokeCommand.saveStash(currentRepo.path, message, includeUntracked);
          queryClient.invalidateQueries({ queryKey: ["stashes", currentRepo.path] });
          setShowCreateStash(false);
          return id;
        }}
      />
    </main>
  );
};
