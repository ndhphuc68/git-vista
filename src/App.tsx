import React, { useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SCREEN_TYPE, TAB_TYPE } from "./domain/enums";
import { RepoHeader } from "./components/header/RepoHeader";
import { InProgressOperationBanner } from "./components/banner/InProgressOperationBanner";
import { type RepoSummary } from "./ipc/bindings.generated";
import { useRepoState } from "./features/conflict";
import { useRepoStore } from "./store/useRepoStore";
import { useTabStore } from "./store/useTabStore";
import { useViewStore } from "./store/useViewStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useRepoChangedListener } from "./hooks/useRepoChangedListener";
import { useExternalLinks } from "./hooks/useExternalLinks";
import { useInProgressActions } from "./hooks/useInProgressActions";
import { useAppTabSync } from "./hooks/useAppTabSync";
import { useAppTabHandlers } from "./hooks/useAppTabHandlers";
import { useAppShellControls } from "./hooks/useAppShellControls";
import { CreateBranchModal } from "./features/branch";
import { ScreenRouter } from "./components/ScreenRouter";
import { AppShellBody } from "./components/AppShellBody";
import { SplashScreen } from "./components/splash/SplashScreen";
import { FileInspectorDrawer } from "./components/inspector/FileInspectorDrawer";
import { PullRequestDetailDrawer, CreatePullRequestModal } from "./components/pullrequests";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";
import { qk } from "./domain/queryKeys";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

interface RepoContentProps {
  currentRepo: RepoSummary;
  clearRepo: () => void;
  isGlobalCreateBranchOpen: boolean;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
}

const RepoContent: React.FC<RepoContentProps> = ({
  currentRepo,
  clearRepo,
  isGlobalCreateBranchOpen,
  setIsGlobalCreateBranchOpen,
}) => {
  const queryClient = useQueryClient();
  const { activeScreen, setActiveScreen, activeConflictFile, closeConflictResolver } =
    useViewStore();

  const { data: repoState } = useRepoState(currentRepo.path);
  const { handleAbort, handleContinue, handleResolveAndStage } = useInProgressActions(
    currentRepo.path
  );

  return (
    <>
      <RepoHeader onBackToWelcome={clearRepo} />
      <InProgressOperationBanner
        repoState={repoState}
        onAbort={handleAbort}
        onContinue={handleContinue}
        onNavigateToChanges={() => setActiveScreen(SCREEN_TYPE.CHANGES)}
      />
      <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
        <ScreenRouter
          activeScreen={activeScreen}
          activeConflictFile={activeConflictFile}
          repoPath={currentRepo.path}
          closeConflictResolver={closeConflictResolver}
          onResolveAndStage={handleResolveAndStage}
        />
      </div>
      <CreateBranchModal
        isOpen={isGlobalCreateBranchOpen}
        onClose={() => setIsGlobalCreateBranchOpen(false)}
        repoPath={currentRepo.path}
        onSuccess={() =>
          // Created a new branch on the current repo: only refresh this repo's cache
          queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) })
        }
      />
      <FileInspectorDrawer repoPath={currentRepo.path} />
      <PullRequestDetailDrawer repoPath={currentRepo.path} />
      <CreatePullRequestModal repoPath={currentRepo.path} />
    </>
  );
};

export interface AppProps {
  skipSplash?: boolean;
}

export const App: React.FC<AppProps> = ({
  skipSplash = typeof process !== "undefined" && process.env?.NODE_ENV === "test",
}) => {
  const [splashFinished, setSplashFinished] = useState(skipSplash);
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { tabs, activeTabId, setActiveTab, openRepoTab, openHomeTab, closeTab, restoreSession } =
    useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const repoToDisplay = activeTab?.type === TAB_TYPE.REPO ? activeTab.repo || currentRepo : null;
  const { setActiveScreen } = useViewStore();
  const { resolvedTheme, setTheme, openSettings, closeSettings } = useSettingsStore();
  const { open: openCommandPalette, close: closeCommandPalette } = useCommandPaletteStore();

  useAppTabSync(tabs, activeTabId, setRepo, clearRepo, restoreSession);

  const { handleSelectRepo, handleBackToWelcome, handleNextTab, handlePrevTab } = useAppTabHandlers(
    {
      tabs,
      activeTabId,
      setActiveTab,
      openRepoTab,
      openHomeTab,
      setRepo,
      clearRepo,
    }
  );

  const shellControls = useAppShellControls({
    repoToDisplay,
    activeTabId,
    closeTab,
    handleBackToWelcome,
    handleNextTab,
    handlePrevTab,
    setActiveScreen,
    resolvedTheme,
    setTheme,
    openSettings,
    closeSettings,
    openCommandPalette,
    closeCommandPalette,
    queryClient,
  });

  useRepoChangedListener(queryClient);
  useExternalLinks();

  return (
    <QueryClientProvider client={queryClient}>
      {!splashFinished && (
        <SplashScreen onFinish={() => setSplashFinished(true)} skipSplash={skipSplash} />
      )}
      <AppShellBody
        repoToDisplay={repoToDisplay}
        handleBackToWelcome={handleBackToWelcome}
        handleSelectRepo={handleSelectRepo}
        RepoContent={RepoContent}
        {...shellControls}
      />
    </QueryClientProvider>
  );
};
