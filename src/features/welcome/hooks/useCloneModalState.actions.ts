import type { ChangeEvent, FormEvent, RefObject } from "react";
import { messageOf, toErrorMessage } from "../../../shared/utils/toError";
import { cancelRemoteTask, cloneRepo, openRepository, selectRepoFolder } from "../api";
import {
  resolveTargetDirOnFolderSelect,
  resolveTargetDirOnUrlChange,
} from "../model/cloneTargetDir";
import type { RepoSummary } from "../../../ipc/bindings.generated";
import type { Translations } from "../../../i18n/vi";

export interface CloneFieldsContext {
  baseDir: string;
  url: string;
  targetDir: string;
  setUrl: (value: string) => void;
  setBaseDir: (value: string) => void;
  setTargetDir: (value: string) => void;
}

/** Builds `CloneModal`'s repository URL change handler. */
export function createCloneUrlChangeHandler(context: CloneFieldsContext) {
  return (e: ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    context.setUrl(newUrl);
    context.setTargetDir(resolveTargetDirOnUrlChange(newUrl, context.baseDir, context.targetDir));
  };
}

/** Builds `CloneModal`'s folder-picker handler. */
export function createCloneSelectFolderHandler(context: CloneFieldsContext) {
  return async () => {
    try {
      const selected = await selectRepoFolder();
      if (selected) {
        context.setBaseDir(selected);
        context.setTargetDir(resolveTargetDirOnFolderSelect(selected, context.url));
      }
    } catch (err: unknown) {
      console.warn("Folder picker error:", err);
    }
  };
}

export interface CloneSubmitContext {
  t: Translations;
  url: string;
  targetDir: string;
  isCloning: boolean;
  activeTaskIdRef: RefObject<string | null>;
  setError: (value: string | null) => void;
  setIsCloning: (value: boolean) => void;
  setProgressPercent: (value: number) => void;
  setStatusText: (value: string) => void;
  onCloneSuccess: (repo: RepoSummary) => void;
  onClose: () => void;
}

/** Builds `CloneModal`'s cancel handler: aborts an in-progress clone, or just closes. */
export function createCloneCancelHandler(context: CloneSubmitContext) {
  return async () => {
    if (context.isCloning && context.activeTaskIdRef.current) {
      try {
        await cancelRemoteTask(context.activeTaskIdRef.current);
      } catch (err: unknown) {
        // The clone is still running when the cancel request itself fails.
        context.setError(toErrorMessage(err));
        return;
      }
      context.setIsCloning(false);
      context.setError(context.t.cloneModal.cancelError);
    } else {
      context.onClose();
    }
  };
}

/**
 * Builds `CloneModal`'s form submit handler: clones the repo under a fresh
 * task id, then opens it. Moved intact from the hook body.
 */
export function createCloneSubmitHandler(context: CloneSubmitContext) {
  return async (e: FormEvent) => {
    e.preventDefault();
    if (!context.url.trim() || !context.targetDir.trim() || context.isCloning) return;

    context.setError(null);
    context.setIsCloning(true);
    context.setProgressPercent(0);
    context.setStatusText(context.t.cloneModal.initStatus);

    const taskId = `task-clone-${Date.now()}`;
    context.activeTaskIdRef.current = taskId;

    try {
      await cloneRepo(context.url.trim(), context.targetDir.trim(), taskId);
      const summary = await openRepository(context.targetDir.trim());
      context.onCloneSuccess(summary);
      context.onClose();
    } catch (err: unknown) {
      context.setError(
        typeof err === "string" ? err : messageOf(err) || context.t.cloneModal.defaultError
      );
    } finally {
      context.setIsCloning(false);
      context.activeTaskIdRef.current = null;
    }
  };
}
