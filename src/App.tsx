import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "./components/Titlebar";
import { ControlsBar } from "./components/ControlsBar";
import { Shell } from "./components/Shell";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { RepoHeader } from "./components/header/RepoHeader";
import { ChangesScreen } from "./components/changes/ChangesScreen";
import { listenToRepoChanged, RepoChangedPayload } from "./ipc/client";
import { useRepoStore } from "./store/useRepoStore";
import { useViewStore } from "./store/useViewStore";
import { useLayoutStore } from "./store/useLayoutStore";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { CreateBranchModal } from "./components/sidebar/CreateBranchModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const [lastEvent, setLastEvent] = useState<RepoChangedPayload | null>(null);
  const [isGlobalCreateBranchOpen, setIsGlobalCreateBranchOpen] = useState(false);
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { activeScreen } = useViewStore();
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
          <>
            {controlsOpen && <ControlsBar lastEvent={lastEvent} />}
            <RepoHeader onBackToWelcome={clearRepo} />
            <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
              {activeScreen === "history" ? <Shell /> : <ChangesScreen />}
            </div>
            <CreateBranchModal
              isOpen={isGlobalCreateBranchOpen}
              onClose={() => setIsGlobalCreateBranchOpen(false)}
              repoPath={currentRepo.path}
              onSuccess={() => queryClient.invalidateQueries()}
            />
          </>
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
      </div>
    </QueryClientProvider>
  );
};

