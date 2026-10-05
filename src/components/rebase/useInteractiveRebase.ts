import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../i18n";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import type {
  RebaseCommitItem,
  RebasePlanStep,
  InteractiveRebaseResult,
} from "../../ipc/bindings.generated";
import { useRebaseCommits } from "../../features/merge";
import { createSubmitHandler } from "./InteractiveRebaseModal.actions";
import { commitsToPickSteps, buildCommitMap } from "./rebaseStepsHelpers";
import {
  createStepReorderHandlers,
  createStepActionHandlers,
  createResetHandler,
  createDragAndDropHandlers,
} from "./useInteractiveRebase.handlers";

const EMPTY_COMMITS: RebaseCommitItem[] = [];

export interface UseInteractiveRebaseArgs {
  isOpen: boolean;
  baseCommitId: string;
  propRepoPath?: string;
  onClose: () => void;
  onRebaseSuccess?: (result: InteractiveRebaseResult) => void;
}

/**
 * State, effects and handlers for InteractiveRebaseModal. Split out of the
 * component so its JSX body stays under the line-per-function limit; hook
 * call order matches the original inline calls exactly.
 */
export function useInteractiveRebase({
  isOpen,
  baseCommitId,
  propRepoPath,
  onClose,
  onRebaseSuccess,
}: UseInteractiveRebaseArgs) {
  const { t } = useTranslation();
  const currentRepo = useRepoStore((s) => s.currentRepo);
  const repoPath = propRepoPath || currentRepo?.path || "";
  const setActiveScreen = useViewStore((s) => s.setActiveScreen);

  const [steps, setSteps] = useState<RebasePlanStep[]>([]);
  const [autoStash, setAutoStash] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch commits between base and HEAD
  const { data: fetchedCommits = EMPTY_COMMITS, isLoading } = useRebaseCommits(
    repoPath,
    baseCommitId,
    isOpen
  );

  // Initialize steps whenever new commits arrive
  useEffect(() => {
    setSteps(fetchedCommits.length > 0 ? commitsToPickSteps(fetchedCommits) : []);
  }, [fetchedCommits]);

  // Map of commit_id -> commit details
  const commitMap = useMemo(() => buildCommitMap(fetchedCommits), [fetchedCommits]);

  const { handleMoveUp, handleMoveDown } = createStepReorderHandlers({ steps, setSteps });
  const { handleActionChange, handleMessageChange } = createStepActionHandlers({
    steps,
    setSteps,
    commitMap,
  });
  const handleReset = createResetHandler({ fetchedCommits, setSteps, setError });
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd } = createDragAndDropHandlers({
    steps,
    setSteps,
    draggedIndex,
    setDraggedIndex,
  });

  // Validation
  const nonDropped = steps.filter((s) => s.action !== "Drop");
  const isAllDropped = steps.length > 0 && nonDropped.length === 0;
  const canSubmit = steps.length > 0 && !isAllDropped && !submitting && !isLoading;

  const handleSubmit = createSubmitHandler({
    t,
    repoPath,
    baseCommitId,
    steps,
    autoStash,
    canSubmit,
    setError,
    setSubmitting,
    setActiveScreen,
    onClose,
    onRebaseSuccess,
  });

  return {
    t,
    steps,
    autoStash,
    setAutoStash,
    submitting,
    error,
    draggedIndex,
    isLoading,
    commitMap,
    canSubmit,
    handleMoveUp,
    handleMoveDown,
    handleActionChange,
    handleMessageChange,
    handleReset,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleSubmit,
  };
}
