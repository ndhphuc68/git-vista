/**
 * Thin wrappers over the repository lifecycle IPC commands and the
 * repo-changed event subscription. This module lives in `features/repo/api`,
 * the only place in `features/repo` allowed to import `ipc/`; `useTabStore`
 * and `App.tsx` compose these functions instead of calling `invokeCommand` or
 * `listenToRepoChanged` directly.
 */
import { invokeCommand, listenToRepoChanged as listenToRepoChangedIpc } from "../../../ipc/client";
import type { RepoChangedPayload, RepoSummary } from "../../../ipc/bindings.generated";

/** Opens the repository at `path` and returns its summary. */
export function openRepository(path: string): Promise<RepoSummary> {
  return invokeCommand.openRepository(path);
}

/** Releases the backend's file watcher and memory for the tab's repository. */
export function closeRepository(tabId: string): Promise<void> {
  return invokeCommand.closeRepository(tabId);
}

/** Subscribes to the backend's repo-changed event; resolves to an unsubscribe function. */
export function listenToRepoChanged(
  handler: (payload: RepoChangedPayload) => void
): Promise<() => void> {
  return listenToRepoChangedIpc(handler);
}
