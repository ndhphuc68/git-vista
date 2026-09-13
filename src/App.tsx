import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Titlebar } from "./components/Titlebar";
import { ControlsBar } from "./components/ControlsBar";
import { Shell } from "./components/Shell";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { RepoHeader } from "./components/header/RepoHeader";
import { ChangesScreen } from "./components/changes/ChangesScreen";
import { InProgressOperationBanner } from "./components/banner/InProgressOperationBanner";
import { listenToRepoChanged, RepoChangedPayload, invokeCommand } from "./ipc/client";
import { RepoSummary } from "./ipc/bindings";
import { useRepoStore } from "./store/useRepoStore";
import { useViewStore } from "./store/useViewStore";
import { useLayoutStore } from "./store/useLayoutStore";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { CreateBranchModal } from "./components/sidebar/CreateBranchModal";
import { ConflictResolverScreen } from "./components/conflict/ConflictResolverScreen";

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
  controlsOpen: boolean;
  lastEvent: RepoChangedPayload | null;
  isGlobalCreateBranchOpen: boolean;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
}

const RepoContent: React.FC<RepoContentProps> = ({
  currentRepo,
  clearRepo,
  controlsOpen,
  lastEvent,
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
      {controlsOpen && <ControlsBar lastEvent={lastEvent} />}
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

export const App: React.FC = () => {
  const [lastEvent, setLastEvent] = useState<RepoChangedPayload | null>(null);
  const [isGlobalCreateBranchOpen, setIsGlobalCreateBranchOpen] = useState(false);
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { controlsOpen } = useLayoutStore();

  useGlobalShortcuts({
    onOpenCreateBranch: () => {
      if (currentRepo) setIsGlobalCreateBranchOpen(true);
    },
    onEscape: () => {
      setIsGlobalCreateBranchOpen(false);
    },
    enabled: true,
  });

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let cancelled = false;

    listenToRepoChanged((payload) => {
      console.log("🔔 [Event] repo-changed payload:", payload);
      setLastEvent(payload);
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
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Titlebar />
        {currentRepo ? (
          <RepoContent
            currentRepo={currentRepo}
            clearRepo={clearRepo}
            controlsOpen={controlsOpen}
            lastEvent={lastEvent}
            isGlobalCreateBranchOpen={isGlobalCreateBranchOpen}
            setIsGlobalCreateBranchOpen={setIsGlobalCreateBranchOpen}
          />
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
      </div>
    </QueryClientProvider>
  );
};
