import type { QueryClient } from "@tanstack/react-query";
import { qk } from "../../domain/queryKeys";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import {
  stageFile,
  unstageFile,
  stageAll,
  unstageAll,
  discardFileChanges,
  restoreDiscard,
  stageHunk,
  stageLines,
  createCommit,
} from "../../features/changes";
import { type SelectedWorkingFile } from "./StagingFileList";
import type { useTranslation } from "../../i18n";
import type { ChangesViewMode } from "../../store/useLayoutStore";

type Translation = ReturnType<typeof useTranslation>["t"];

/** Every handler invalidates the same repo-wide scope after its command settles. */
function invalidateRepoScope(queryClient: QueryClient, repoPath: string) {
  return queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
}

export interface SelectFileContext {
  setSelectedFile: (file: SelectedWorkingFile) => void;
  isMobile: boolean;
  setActiveChangesView: (view: ChangesViewMode) => void;
}

export function createSelectFileHandler(ctx: SelectFileContext) {
  return (file: SelectedWorkingFile) => {
    ctx.setSelectedFile(file);
    if (ctx.isMobile) {
      ctx.setActiveChangesView("diff");
    }
  };
}

export interface StageFileContext {
  repoPath: string;
  setSelectedFile: (file: SelectedWorkingFile) => void;
  queryClient: QueryClient;
}

export function createStageFileHandler(ctx: StageFileContext) {
  return async (filePath: string) => {
    await stageFile(ctx.repoPath, filePath);
    ctx.setSelectedFile({ path: filePath, is_staged: true });
    // Only refresh the current repo's cache, don't wipe other repos' caches
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createUnstageFileHandler(ctx: StageFileContext) {
  return async (filePath: string) => {
    await unstageFile(ctx.repoPath, filePath);
    ctx.setSelectedFile({ path: filePath, is_staged: false });
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export interface RepoScopeContext {
  repoPath: string;
  queryClient: QueryClient;
}

export function createStageAllHandler(ctx: RepoScopeContext) {
  return async () => {
    await stageAll(ctx.repoPath);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createUnstageAllHandler(ctx: RepoScopeContext) {
  return async () => {
    await unstageAll(ctx.repoPath);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export interface DiscardFileContext {
  repoPath: string;
  t: Translation;
  queryClient: QueryClient;
}

export function createDiscardFileHandler(ctx: DiscardFileContext) {
  return async (filePath: string) => {
    try {
      const repoPath = ctx.repoPath;
      const token = await discardFileChanges(repoPath, filePath);
      useToastStore.getState().showToast({
        type: "success",
        message: ctx.t.discard.success.replace("{path}", filePath),
        durationMs: 10000,
        undoAction: async () => {
          await restoreDiscard(repoPath, token);
          await invalidateRepoScope(ctx.queryClient, repoPath);
        },
      });
      await invalidateRepoScope(ctx.queryClient, repoPath);
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };
}

export interface HunkContext {
  repoPath: string;
  selectedFile: SelectedWorkingFile | null;
  queryClient: QueryClient;
}

export function createStageHunkHandler(ctx: HunkContext) {
  return async (hunkIndex: number) => {
    if (!ctx.selectedFile) return;
    await stageHunk(ctx.repoPath, ctx.selectedFile.path, hunkIndex, false);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createUnstageHunkHandler(ctx: HunkContext) {
  return async (hunkIndex: number) => {
    if (!ctx.selectedFile) return;
    await stageHunk(ctx.repoPath, ctx.selectedFile.path, hunkIndex, true);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createStageLinesHandler(ctx: HunkContext) {
  return async (hunkIndex: number, lineIndices: number[]) => {
    if (!ctx.selectedFile) return;
    await stageLines(ctx.repoPath, ctx.selectedFile.path, hunkIndex, lineIndices, false);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createUnstageLinesHandler(ctx: HunkContext) {
  return async (hunkIndex: number, lineIndices: number[]) => {
    if (!ctx.selectedFile) return;
    await stageLines(ctx.repoPath, ctx.selectedFile.path, hunkIndex, lineIndices, true);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
  };
}

export function createCommitHandler(ctx: RepoScopeContext) {
  return async (summary: string, description?: string, amend?: boolean) => {
    const result = await createCommit(ctx.repoPath, summary, description, amend);
    await invalidateRepoScope(ctx.queryClient, ctx.repoPath);
    return result;
  };
}
