import { useEffect } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { listenToRepoChanged } from "../features/repo";

/**
 * Subscribes to the backend's repo-changed event and invalidates the affected
 * queries. When the payload names a repo path, only queries for that repo are
 * invalidated; otherwise the whole cache is wiped rather than guessing wrong
 * and leaving stale data behind.
 */
export function useRepoChangedListener(queryClient: QueryClient) {
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let cancelled = false;

    listenToRepoChanged((payload) => {
      // Selective invalidation: only refresh queries belonging to the repo that changed
      if (payload?.repo_path) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.some(
              (part) => typeof part === "string" && part.includes(payload.repo_path)
            );
          },
        });
      } else {
        // A repo-changed event without repo_path means we don't know which repo was
        // affected: deliberately wipe the whole cache rather than guess the scope
        // wrong and leave stale data behind.
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
  }, [queryClient]);
}
