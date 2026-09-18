import React, { useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "./components/Shell";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { RepoHeader } from "./components/header/RepoHeader";
import { WindowTabBar } from "./components/header/WindowTabBar";
import { ChangesScreen } from "./components/changes/ChangesScreen";
import { InProgressOperationBanner } from "./components/banner/InProgressOperationBanner";
import { listenToRepoChanged, invokeCommand } from "./ipc/client";
import { type RepoSummary } from "./ipc/bindings";
import { useRepoStore } from "./store/useRepoStore";
import { useTabStore } from "./store/useTabStore";
import { useViewStore } from "./store/useViewStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { CreateBranchModal } from "./components/sidebar/CreateBranchModal";
import { ConflictResolverScreen } from "./components/conflict/ConflictResolverScreen";
import { ToastContainer } from "./components/toast/ToastContainer";
import { CommandPalette } from "./components/palette/CommandPalette";
import { ShortcutsHelpModal } from "./components/shortcuts/ShortcutsHelpModal";
import { SplashScreen } from "./components/splash/SplashScreen";
import { SettingsModal } from "./components/settings/SettingsModal";
import { FileInspectorDrawer } from "./components/inspector/FileInspectorDrawer";
import { ManageRemotesModal } from "./components/remote/ManageRemotesModal";
import { InteractiveRebaseModal } from "./components/rebase";
import { CompareModal } from "./components/compare";
import { PullRequestDetailDrawer, CreatePullRequestModal } from "./components/pullrequests";
import { usePullRequestStore } from "./store/usePullRequestStore";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";
import { type CommandContext } from "./utils/commandRegistry";
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

  const { data: repoState } = useQuery({
    queryKey: qk.repo.state(currentRepo.path),
    queryFn: () => invokeCommand.getRepoState(currentRepo.path),
    enabled: Boolean(currentRepo),
  });

  const handleAbort = async (operation: string) => {
    await invokeCommand.abortInProgress(currentRepo.path, operation);
    // Thao tác Git trên repo hiện tại: chỉ làm mới cache của repo này
    queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) });
  };

  const handleContinue = async (operation: string) => {
    await invokeCommand.continueInProgress(currentRepo.path, operation);
    // Thao tác Git trên repo hiện tại: chỉ làm mới cache của repo này
    queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) });
  };

  return (
    <>
      <RepoHeader onBackToWelcome={clearRepo} />
      <InProgressOperationBanner
        repoState={repoState}
        onAbort={handleAbort}
        onContinue={handleContinue}
        onNavigateToChanges={() => setActiveScreen("changes")}
      />
      <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
        {activeScreen === "history" ? (
          <Shell />
        ) : activeScreen === "conflict" && activeConflictFile ? (
          <ConflictResolverScreen
            filePath={activeConflictFile}
            repoPath={currentRepo.path}
            onBack={closeConflictResolver}
            onSaveAndStage={async (content) => {
              await invokeCommand.resolveConflictFile(
                currentRepo.path,
                activeConflictFile,
                content,
                true
              );
              closeConflictResolver();
              // Thao tác Git trên repo hiện tại: chỉ làm mới cache của repo này
              queryClient.invalidateQueries({ queryKey: qk.repo.all(currentRepo.path) });
            }}
          />
        ) : (
          <ChangesScreen />
        )}
      </div>
      <CreateBranchModal
        isOpen={isGlobalCreateBranchOpen}
        onClose={() => setIsGlobalCreateBranchOpen(false)}
        repoPath={currentRepo.path}
        onSuccess={() =>
          // Tạo nhánh mới trên repo hiện tại: chỉ làm mới cache của repo này
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
  const [isGlobalCreateBranchOpen, setIsGlobalCreateBranchOpen] = useState(false);
  const [isGlobalManageRemotesOpen, setIsGlobalManageRemotesOpen] = useState(false);
  const [isGlobalInteractiveRebaseOpen, setIsGlobalInteractiveRebaseOpen] = useState(false);
  const [isGlobalCompareOpen, setIsGlobalCompareOpen] = useState(false);
  const [compareBaseRev, setCompareBaseRev] = useState<string | undefined>(undefined);
  const [compareTargetRev, setCompareTargetRev] = useState<string | undefined>(undefined);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { tabs, activeTabId, setActiveTab, openRepoTab, openHomeTab, closeTab, restoreSession } =
    useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const repoToDisplay = activeTab?.type === "repo" ? activeTab.repo || currentRepo : null;
  const { setActiveScreen } = useViewStore();
  const { resolvedTheme, setTheme, mode, setMode, openSettings, closeSettings } =
    useSettingsStore();
  const { open: openCommandPalette, close: closeCommandPalette } = useCommandPaletteStore();

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleToggleMode = () => {
    setMode(mode === "simple" ? "advanced" : "simple");
  };

  // Đồng bộ tab đang active sang repoStore để tương thích ngược với mọi component con
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.type === "repo" && activeTab.repo) {
      setRepo(activeTab.repo);
    } else if (activeTabId === "home") {
      clearRepo();
    }
  }, [activeTabId, tabs, setRepo, clearRepo]);

  // Khôi phục phiên làm việc trước đó khi khởi động app
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleSelectRepo = useCallback(
    (repo: RepoSummary) => {
      openRepoTab(repo);
      setRepo(repo);
    },
    [openRepoTab, setRepo]
  );

  const handleBackToWelcome = useCallback(() => {
    openHomeTab();
    clearRepo();
  }, [openHomeTab, clearRepo]);

  const handleNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex >= 0 && tabs.length > 1) {
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (nextTab) setActiveTab(nextTab.id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  const handlePrevTab = useCallback(() => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex >= 0 && tabs.length > 1) {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      const prevTab = tabs[prevIndex];
      if (prevTab) setActiveTab(prevTab.id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  useGlobalShortcuts({
    onOpenCreateBranch: () => {
      if (repoToDisplay) setIsGlobalCreateBranchOpen(true);
    },
    onOpenCommandPalette: () => {
      openCommandPalette();
    },
    onOpenShortcutsHelp: () => {
      setIsShortcutsHelpOpen(true);
    },
    onToggleTheme: handleToggleTheme,
    onOpenSettings: () => {
      openSettings();
    },
    onNewTab: handleBackToWelcome,
    onCloseTab: () => {
      if (activeTabId !== "home") {
        closeTab(activeTabId);
      }
    },
    onNextTab: handleNextTab,
    onPrevTab: handlePrevTab,
    onEscape: () => {
      setIsGlobalCreateBranchOpen(false);
      setIsGlobalManageRemotesOpen(false);
      setIsGlobalInteractiveRebaseOpen(false);
      setIsGlobalCompareOpen(false);
      setIsShortcutsHelpOpen(false);
      usePullRequestStore.getState().closeCreateModal();
      usePullRequestStore.getState().closeDrawer();
      closeSettings();
      closeCommandPalette();
    },
    enabled: true,
  });

  const commandContext: CommandContext = {
    repoPath: repoToDisplay?.path,
    navigate: (screen) => setActiveScreen(screen),
    openCreateBranch: () => {
      if (repoToDisplay) setIsGlobalCreateBranchOpen(true);
    },
    openManageRemotes: () => {
      if (repoToDisplay) setIsGlobalManageRemotesOpen(true);
    },
    openInteractiveRebase: () => {
      if (repoToDisplay) setIsGlobalInteractiveRebaseOpen(true);
    },
    openCompare: () => {
      if (repoToDisplay) {
        setCompareBaseRev(repoToDisplay.head_branch || "main");
        setCompareTargetRev("HEAD");
        setIsGlobalCompareOpen(true);
      }
    },
    openCreatePullRequest: () => {
      if (repoToDisplay) usePullRequestStore.getState().openCreateModal();
    },
    openPullRequests: () => {
      if (repoToDisplay) {
        setActiveScreen("history");
      }
    },
    openShortcutsHelp: () => setIsShortcutsHelpOpen(true),
    toggleTheme: handleToggleTheme,
    toggleMode: handleToggleMode,
    openSettings: () => openSettings(),
  };

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let cancelled = false;

    listenToRepoChanged((payload) => {
      console.log("🔔 [Event] repo-changed payload:", payload);
      // Invalidate có chọn lọc: chỉ làm mới query của riêng repo bị thay đổi
      if (payload?.repo_path) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.some(
              (part) => typeof part === "string" && part.includes(payload.repo_path)
            );
          },
        });
      } else {
        // Sự kiện repo-changed không kèm repo_path (không rõ repo nào bị ảnh hưởng):
        // cố ý xoá sạch toàn bộ cache thay vì đoán sai phạm vi và để lại dữ liệu cũ.
        queryClient.invalidateQueries();
      }
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
      } else {
        unlistenFn = unlisten;
      }
    });

    return () => {
      cancelled = true;
      if (unlistenFn) unlistenFn();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!splashFinished && (
        <SplashScreen onFinish={() => setSplashFinished(true)} skipSplash={skipSplash} />
      )}
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {/* Top Window Tab Bar */}
        <WindowTabBar onNewTab={handleBackToWelcome} />

        {/* Main Workspace Area */}
        {repoToDisplay ? (
          <RepoContent
            currentRepo={repoToDisplay}
            clearRepo={handleBackToWelcome}
            isGlobalCreateBranchOpen={isGlobalCreateBranchOpen}
            setIsGlobalCreateBranchOpen={setIsGlobalCreateBranchOpen}
          />
        ) : (
          <WelcomeScreen onSelectRepo={handleSelectRepo} />
        )}
        <ToastContainer />
        <CommandPalette context={commandContext} />
        <ShortcutsHelpModal
          isOpen={isShortcutsHelpOpen}
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
        <SettingsModal currentRepoPath={repoToDisplay?.path ?? null} />
        {repoToDisplay && (
          <ManageRemotesModal
            isOpen={isGlobalManageRemotesOpen}
            onClose={() => setIsGlobalManageRemotesOpen(false)}
            repoPath={repoToDisplay.path}
          />
        )}
        {repoToDisplay && (
          <InteractiveRebaseModal
            isOpen={isGlobalInteractiveRebaseOpen}
            onClose={() => setIsGlobalInteractiveRebaseOpen(false)}
            repoPath={repoToDisplay.path}
            baseCommitId={useRepoStore.getState().selectedCommitId || "HEAD~5"}
            onRebaseSuccess={() => {
              setIsGlobalInteractiveRebaseOpen(false);
              // Rebase tương tác trên repo hiện tại: chỉ làm mới cache của repo này
              queryClient.invalidateQueries({ queryKey: qk.repo.all(repoToDisplay.path) });
            }}
          />
        )}
        {repoToDisplay && (
          <CompareModal
            isOpen={isGlobalCompareOpen}
            onClose={() => setIsGlobalCompareOpen(false)}
            repoPath={repoToDisplay.path}
            initialBaseRev={compareBaseRev}
            initialTargetRev={compareTargetRev}
          />
        )}
      </div>
    </QueryClientProvider>
  );
};
