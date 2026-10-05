import { useEffect, useRef, type MutableRefObject } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import { useSettingsStore } from "../../../store/useSettingsStore";

/** One background fetch: silent (no progress task id), refreshes the repo's queries on success. */
function runAutoFetch(
  repoPath: string,
  queryClient: QueryClient,
  inFlight: MutableRefObject<boolean>
) {
  inFlight.current = true;
  invokeCommand
    .fetchRepo(repoPath, undefined, false)
    .then(() => queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) }))
    .catch((error: unknown) => console.warn("Auto-fetch failed", error))
    .finally(() => {
      inFlight.current = false;
    });
}

/**
 * Fetches the active repository in the background every
 * `autoFetchInterval` seconds from Settings › Git behavior (0 turns it off).
 * A tick is skipped while the window is hidden, while a manual
 * fetch/pull/push runs, or while the previous auto-fetch is unfinished.
 */
export function useAutoFetch(repoPath: string | undefined, isRemoteBusy: boolean): void {
  const queryClient = useQueryClient();
  const intervalSec = useSettingsStore((s) => s.autoFetchInterval);
  const busy = useRef(isRemoteBusy);
  const inFlight = useRef(false);

  useEffect(() => {
    busy.current = isRemoteBusy;
  }, [isRemoteBusy]);

  useEffect(() => {
    if (!repoPath || intervalSec <= 0) return;
    const timer = setInterval(() => {
      if (document.hidden || busy.current || inFlight.current) return;
      runAutoFetch(repoPath, queryClient, inFlight);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [repoPath, intervalSec, queryClient]);
}
