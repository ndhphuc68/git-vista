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
  const { currentRepo, setRepo, clearRepo } = useRepoStore();
  const { activeScreen } = useViewStore();
  const { controlsOpen } = useLayoutStore();

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <Titlebar />
        {currentRepo ? (
          <>
            {controlsOpen && <ControlsBar lastEvent={lastEvent} />}
            <RepoHeader onBackToWelcome={clearRepo} />
            <div
              style={{
                flex: 1,
                minHeight: 0,
                height: "100%",
                width: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {activeScreen === "history" ? <Shell /> : <ChangesScreen />}
            </div>
          </>
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
      </div>
    </QueryClientProvider>
  );
};

