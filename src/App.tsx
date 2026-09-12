import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "./components/Titlebar";
import { ControlsBar } from "./components/ControlsBar";
import { Shell } from "./components/Shell";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { RepoHeader } from "./components/header/RepoHeader";
import { listenToRepoChanged, RepoChangedPayload } from "./ipc/client";
import { useRepoStore } from "./store/useRepoStore";

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

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;

    listenToRepoChanged((payload) => {
      console.log("🔔 [Event] repo-changed payload:", payload);
      setLastEvent(payload);
      // Invalidate queries khi repo thay đổi theo mục 4.4 của spec
      queryClient.invalidateQueries();
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    return () => {
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
            <ControlsBar lastEvent={lastEvent} />
            <RepoHeader onBackToWelcome={clearRepo} />
            <Shell />
          </>
        ) : (
          <WelcomeScreen onSelectRepo={setRepo} />
        )}
      </div>
    </QueryClientProvider>
  );
};

