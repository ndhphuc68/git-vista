import React from "react";
import { qk } from "../../domain/queryKeys";
import { useChangesScreen } from "./useChangesScreen";
import { MobileChangesSwitcher } from "./MobileChangesSwitcher";
import { ChangesContentArea } from "./ChangesContentArea";
import { ChangesStashModal } from "./ChangesStashModal";

export const ChangesScreen: React.FC = () => {
  const {
    t,
    currentRepo,
    sidebarOpen,
    activeChangesView,
    setActiveChangesView,
    openConflictResolver,
    isMobile,
    isLaptop,
    status,
    selectedFile,
    showCreateStash,
    setShowCreateStash,
    saveStash,
    queryClient,
    handlers,
  } = useChangesScreen();

  if (!currentRepo) {
    return (
      <div className="flex items-center justify-center h-full text-tertiary text-xs">
        {t.changes.noRepoOpen}
      </div>
    );
  }

  const stagedCount = status?.staged?.length ?? 0;
  const showSidebar = isMobile ? activeChangesView !== "diff" : sidebarOpen;
  const showDiffViewer = isMobile ? activeChangesView !== "files" : true;

  return (
    <main
      data-testid="changes-screen-main"
      className="flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden bg-surface"
    >
      {/* Mobile view switcher tab */}
      {isMobile && (
        <MobileChangesSwitcher
          activeChangesView={activeChangesView}
          setActiveChangesView={setActiveChangesView}
          status={status}
        />
      )}

      {/* Main Content Area */}
      <ChangesContentArea
        showSidebar={showSidebar}
        showDiffViewer={showDiffViewer}
        repoPath={currentRepo.path}
        isMobile={isMobile}
        isLaptop={isLaptop}
        status={status}
        selectedFile={selectedFile}
        onSelectFile={handlers.handleSelectFile}
        onStageFile={handlers.handleStageFile}
        onUnstageFile={handlers.handleUnstageFile}
        onStageAll={handlers.handleStageAll}
        onUnstageAll={handlers.handleUnstageAll}
        onDiscardFile={handlers.handleDiscardFile}
        onOpenConflictResolver={openConflictResolver}
        stagedCount={stagedCount}
        onCommit={handlers.handleCommit}
        onCommitSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) });
        }}
        onSaveStashClick={() => setShowCreateStash(true)}
        onStageHunk={handlers.handleStageHunk}
        onUnstageHunk={handlers.handleUnstageHunk}
        onStageLines={handlers.handleStageLines}
        onUnstageLines={handlers.handleUnstageLines}
      />

      <ChangesStashModal
        isOpen={showCreateStash}
        repoPath={currentRepo.path}
        saveStash={saveStash}
        onClose={() => setShowCreateStash(false)}
      />
    </main>
  );
};
