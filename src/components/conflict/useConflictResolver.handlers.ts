import type { RefObject } from "react";
import type { ConflictFileData, ConflictHunk } from "../../ipc/bindings.generated";
import type { Translations } from "../../i18n/vi";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";

/**
 * Handler factories for useConflictResolver, split out verbatim so the hook
 * body stays under the line-per-function limit. Each factory takes a plain
 * context of the hook's state/setters and returns the same closures the hook
 * used to define inline; behaviour, including recreation on every render, is
 * unchanged.
 */

export interface ResolutionHandlersContext {
  resolutions: Record<string, string>;
  setResolutions: (
    updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  conflictHunks: ConflictHunk[];
}

export function createResolutionHandlers({
  resolutions,
  setResolutions,
  conflictHunks,
}: ResolutionHandlersContext) {
  const handleSetResolution = (hunkId: string, value: string) => {
    setResolutions((prev) => ({ ...prev, [hunkId]: value }));
  };

  const handleTakeAllOurs = () => {
    const next: Record<string, string> = { ...resolutions };
    conflictHunks.forEach((h) => {
      next[h.id] = h.ours || "";
    });
    setResolutions(next);
  };

  const handleTakeAllTheirs = () => {
    const next: Record<string, string> = { ...resolutions };
    conflictHunks.forEach((h) => {
      next[h.id] = h.theirs || "";
    });
    setResolutions(next);
  };

  return { handleSetResolution, handleTakeAllOurs, handleTakeAllTheirs };
}

export interface ConflictNavigationContext {
  conflictHunks: ConflictHunk[];
  currentConflictIndex: number;
  setCurrentConflictIndex: (index: number) => void;
  hunkRefs: RefObject<Record<string, HTMLDivElement | null>>;
}

export function createConflictNavigation({
  conflictHunks,
  currentConflictIndex,
  setCurrentConflictIndex,
  hunkRefs,
}: ConflictNavigationContext) {
  const scrollToConflict = (index: number) => {
    if (index >= 0 && index < conflictHunks.length) {
      setCurrentConflictIndex(index);
      const targetId = conflictHunks[index]?.id;
      if (targetId && hunkRefs.current[targetId]) {
        hunkRefs.current[targetId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handlePrevConflict = () => {
    if (currentConflictIndex > 0) {
      scrollToConflict(currentConflictIndex - 1);
    }
  };

  const handleNextConflict = () => {
    if (currentConflictIndex < conflictHunks.length - 1) {
      scrollToConflict(currentConflictIndex + 1);
    }
  };

  return { handlePrevConflict, handleNextConflict };
}

export interface SaveHandlerContext {
  t: Translations;
  fileData: ConflictFileData | undefined;
  totalConflicts: number;
  resolvedCount: number;
  resolutions: Record<string, string>;
  setIsSaving: (saving: boolean) => void;
  onSaveAndStage: (resolvedContent: string) => Promise<void>;
}

function confirmUnresolvedSave(t: Translations, unresolvedCount: number): boolean {
  if (unresolvedCount <= 0) return true;
  return typeof window !== "undefined" && typeof window.confirm === "function"
    ? window.confirm(t.conflictResolver.unresolvedWarning.replace("{count}", String(unresolvedCount)))
    : true;
}

export function createSaveHandler({
  t,
  fileData,
  totalConflicts,
  resolvedCount,
  resolutions,
  setIsSaving,
  onSaveAndStage,
}: SaveHandlerContext) {
  return async () => {
    if (!fileData) return;
    const unresolvedCount = totalConflicts - resolvedCount;
    if (!confirmUnresolvedSave(t, unresolvedCount)) return;

    let finalText = "";
    for (const hunk of fileData.hunks) {
      if (!hunk.is_conflict) {
        finalText += hunk.content || "";
      } else {
        finalText += resolutions[hunk.id] ?? "";
      }
    }

    setIsSaving(true);
    try {
      await onSaveAndStage(finalText);
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err, t));
    } finally {
      setIsSaving(false);
    }
  };
}
