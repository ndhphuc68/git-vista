import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "./components/Shell";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { RepoHeader } from "./components/header/RepoHeader";
import { ChangesScreen } from "./components/changes/ChangesScreen";
import { InProgressOperationBanner } from "./components/banner/InProgressOperationBanner";
import { listenToRepoChanged, invokeCommand } from "./ipc/client";
import { RepoSummary } from "./ipc/bindings";
import { useRepoStore } from "./store/useRepoStore";
import { useViewStore } from "./store/useViewStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { CreateBranchModal } from "./components/sidebar/CreateBranchModal";
import { ConflictResolverScreen } from "./components/conflict/ConflictResolverScreen";
import { ToastContainer } from "./components/toast/ToastContainer";
import { CommandPalette } from "./components/palette/CommandPalette";
import { ShortcutsHelpModal } from "./components/shortcuts/ShortcutsHelpModal";
import { SplashScreen } from "./components/splash/SplashScreen";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";
import { CommandContext } from "./utils/commandRegistry";

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
  const { activeScreen, setActiveScreen, activeConflictFile, closeConflictResolver } = useViewStore();

  const { data: repoState } = useQuery({
    queryKey: ["repo_state", currentRepo.path],
    queryFn: () => invokeCommand.getRepoState(currentRepo.path),
    enabled: Boolean(currentRepo),
  });

  const handleAbort = async (operation: string) => {
    await invokeCommand.abortInProgress(currentRepo.path, operation);
    queryClient.invalidateQueries();
  };

  const handleContinue = async (operation: string) => {
    await invokeCommand.continueInProgress(currentRepo.path, operation);
    queryClient.invalidateQueries();
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
              queryClient.invalidateQueries();
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
        onSuccess={() => queryClient.invalidateQueries()}
      />
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
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { resolvedTheme, setTheme, mode, setMode } = useSettingsStore();
  const { open: openCommandPalette, close: closeCommandPalette } = useCommandPaletteStore();

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleToggleMode = () => {
    setMode(mode === "simple" ? "advanced" : "simple");
  };

  useGlobalShortcuts({
    onOpenCreateBranch: () => {
      if (currentRepo) setIsGlobalCreateBranchOpen(true);
    },
    onOpenCommandPalette: () => {
      openCommandPalette();
    },
    onOpenShortcutsHelp: () => {
      setIsShortcutsHelpOpen(true);
    },
    onToggleTheme: handleToggleTheme,
    onEscape: () => {
      setIsGlobalCreateBranchOpen(false);
      setIsShortcutsHelpOpen(false);
      closeCommandPalette();
    },
    enabled: true,
  });

  const commandContext: CommandContext = {
    repoPath: currentRepo?.path,
    navigate: (screen) => setActiveScreen(screen),
    openCreateBranch: () => {
      if (currentRepo) setIsGlobalCreateBranchOpen(true);
    },
    openShortcutsHelp: () => setIsShortcutsHelpOpen(true),
    toggleTheme: handleToggleTheme,
    toggleMode: handleToggleMode,
  };

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let cancelled = false;

    listenToRepoChanged((payload) => {
      console.log("🔔 [Event] repo-changed payload:", payload);
      // Invalidate queries khi repo thay đổi theo mục 4.4 của spec
      queryClient.invalidateQueries();
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
        <SplashScreen
          onFinish={() => setSplashFinished(true)}
          skipSplash={skipSplash}
        />
      )}
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {currentRepo ? (
          <RepoContent
            currentRepo={currentRepo}
            clearRepo={clearRepo}
            isGlobalCreateBranchOpen={isGlobalCreateBranchOpen}
            setIsGlobalCreateBranchOpen={setIsGlobalCreateBranchOpen}
          />
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
        <ToastContainer />
        <CommandPalette context={commandContext} />
        <ShortcutsHelpModal
          isOpen={isShortcutsHelpOpen}
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
      </div>
    </QueryClientProvider>
  );
};
