import { useMemo, useRef, useState } from "react";
import { useConflictFile, type ConflictFileData } from "../../features/conflict";
import { useTranslation } from "../../i18n";
import {
  createResolutionHandlers,
  createConflictNavigation,
  createSaveHandler,
} from "./useConflictResolver.handlers";

export interface UseConflictResolverArgs {
  filePath: string;
  repoPath: string;
  conflictData?: ConflictFileData;
  onSaveAndStage: (resolvedContent: string) => Promise<void>;
}

/**
 * State, derived data and handlers for ConflictResolverScreen. Split out of
 * the component so its JSX body stays under the line-per-function limit;
 * hook call order matches the original inline calls exactly.
 */
export function useConflictResolver({
  filePath,
  repoPath,
  conflictData,
  onSaveAndStage,
}: UseConflictResolverArgs) {
  const { t } = useTranslation();
  const { data, isLoading } = useConflictFile(repoPath, filePath, !conflictData);

  const fileData = conflictData || data;

  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const conflictHunks = useMemo(() => {
    return fileData?.hunks.filter((h) => h.is_conflict) || [];
  }, [fileData]);

  const hunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const totalConflicts = conflictHunks.length;
  const resolvedCount = useMemo(() => {
    return conflictHunks.filter((h) => resolutions[h.id] !== undefined).length;
  }, [conflictHunks, resolutions]);

  const { handleSetResolution, handleTakeAllOurs, handleTakeAllTheirs } = createResolutionHandlers({
    resolutions,
    setResolutions,
    conflictHunks,
  });

  const { handlePrevConflict, handleNextConflict } = createConflictNavigation({
    conflictHunks,
    currentConflictIndex,
    setCurrentConflictIndex,
    hunkRefs,
  });

  const handleSave = createSaveHandler({
    t,
    fileData,
    totalConflicts,
    resolvedCount,
    resolutions,
    setIsSaving,
    onSaveAndStage,
  });

  const registerHunkRef = (hunkId: string, el: HTMLDivElement | null) => {
    hunkRefs.current[hunkId] = el;
  };

  return {
    t,
    isLoading,
    fileData,
    resolutions,
    currentConflictIndex,
    isSaving,
    totalConflicts,
    resolvedCount,
    handleSetResolution,
    handleTakeAllOurs,
    handleTakeAllTheirs,
    handlePrevConflict,
    handleNextConflict,
    handleSave,
    registerHunkRef,
  };
}
