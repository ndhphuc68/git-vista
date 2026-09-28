/**
 * Thin wrappers over the recent-repository IPC commands used by the welcome
 * flow. This is the only module in `features/welcome` allowed to import
 * `ipc/`; `hooks/useRecentRepositories` composes these functions instead of
 * calling `invokeCommand` directly.
 */
import {
  invokeCommand,
  listenToTaskProgress as listenToTaskProgressIpc,
  type TaskProgressPayload,
} from "../../../ipc/client";
import { type RecentRepoEntry, type RepoSummary } from "../../../ipc/bindings.generated";

/** List of repositories the user opened recently, most recent first. */
export function getRecentRepos(): Promise<RecentRepoEntry[]> {
  return invokeCommand.getRecentRepos();
}

/** Opens the repository at `path` and returns its summary. */
export function openRepository(path: string): Promise<RepoSummary> {
  return invokeCommand.openRepository(path);
}

/** Shows the native folder picker; resolves to null if the user cancels. */
export function selectRepoFolder(): Promise<string | null> {
  return invokeCommand.selectRepoFolder();
}

/** Clears the entire recent-repositories list. */
export function clearRecentRepos(): Promise<void> {
  return invokeCommand.clearRecentRepos();
}

/** Removes a single entry from the recent-repositories list. */
export function removeRecentRepo(path: string): Promise<void> {
  return invokeCommand.removeRecentRepo(path);
}

/** Clones `url` into `targetDir`, reporting progress under `taskId`. */
export function cloneRepo(url: string, targetDir: string, taskId?: string): Promise<string> {
  return invokeCommand.cloneRepo(url, targetDir, taskId);
}

/** Cancels the in-progress remote task identified by `taskId`. */
export function cancelRemoteTask(taskId: string): Promise<void> {
  return invokeCommand.cancelRemoteTask(taskId);
}

/** Subscribes to the backend's task-progress event; resolves to an unsubscribe function. */
export function listenToTaskProgress(
  handler: (payload: TaskProgressPayload) => void
): Promise<() => void> {
  return listenToTaskProgressIpc(handler);
}
