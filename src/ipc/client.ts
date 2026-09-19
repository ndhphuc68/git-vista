/**
 * The app's IPC surface.
 *
 * The commands themselves live in the domain modules beside this file, split to
 * match `src-tauri/src/commands/`. This assembles them into the single
 * `invokeCommand` object the app has always called, and owns the two event
 * listeners, which are subscriptions rather than commands.
 */
import { type RepoChangedPayload, type TaskProgressPayload } from "./bindings.generated";
import { isTauri } from "./core";

import { appCommands } from "./app";
import { branchCommands } from "./branch";
import { commitActionCommands } from "./commitActions";
import { compareCommands } from "./compare";
import { configCommands } from "./config";
import { conflictCommands } from "./conflict";
import { githubCommands } from "./github";
import { historyCommands } from "./history";
import { mergeCommands } from "./merge";
import { rebaseCommands } from "./rebase";
import { remoteCommands } from "./remote";
import { repoCommands } from "./repo";
import { stagingCommands } from "./staging";
import { stashCommands } from "./stash";
import { tagCommands } from "./tag";
import { undoCommands } from "./undo";

export { isTauri };

export {
  resetMockTags,
  resetMockRemotes,
  resetMockRebaseCommits,
  resetMockGitConfig,
  resetMockCompareData,
} from "./mocks";

export const invokeCommand = {
  ...appCommands,
  ...repoCommands,
  ...historyCommands,
  ...stagingCommands,
  ...branchCommands,
  ...remoteCommands,
  ...stashCommands,
  ...tagCommands,
  ...mergeCommands,
  ...rebaseCommands,
  ...commitActionCommands,
  ...conflictCommands,
  ...compareCommands,
  ...configCommands,
  ...githubCommands,
  ...undoCommands,
};

export async function listenToRepoChanged(
  handler: (payload: RepoChangedPayload) => void
): Promise<() => void> {
  if (!isTauri()) {
    const mockListener = (e: Event) => {
      const customEvent = e as CustomEvent<RepoChangedPayload>;
      handler(customEvent.detail);
    };
    window.addEventListener("mock-repo-changed", mockListener);
    return () => window.removeEventListener("mock-repo-changed", mockListener);
  }

  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<RepoChangedPayload>("repo-changed", (event) => {
    handler(event.payload);
  });
  return unlisten;
}

export async function listenToTaskProgress(
  handler: (payload: TaskProgressPayload) => void
): Promise<() => void> {
  if (!isTauri()) {
    const mockListener = (e: Event) => {
      const customEvent = e as CustomEvent<TaskProgressPayload>;
      handler(customEvent.detail);
    };
    window.addEventListener("mock-task-progress", mockListener);
    return () => window.removeEventListener("mock-task-progress", mockListener);
  }

  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<TaskProgressPayload>("task-progress", (event) => {
    handler(event.payload);
  });
  return unlisten;
}

export type {
  SystemInfo,
  RepoHeadInfo,
  RepoChangedPayload,
  TaskProgressPayload,
  FileStatus,
  StatusFileItem,
  RepoStatusResult,
  StashItem,
  RepoStateInfo,
  MergeResult,
  RebaseResult,
  CommitActionResult,
  ConflictHunk,
  ConflictFileData,
  ConfigScope,
  GitConfigDto,
  TagItem,
  RemoteItem,
  PruneResult,
  RebaseCommitItem,
  RebaseActionKind,
  RebasePlanStep,
  InteractiveRebaseResult,
  CompareMode,
  CompareCommitItem,
  CompareFileItem,
  CompareSummary,
} from "./bindings.generated";
