import type { DragEvent } from "react";
import type {
  RebaseCommitItem,
  RebasePlanStep,
  RebaseActionKind,
} from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";
import { sanitizeFirstAction, commitsToPickSteps } from "./rebaseStepsHelpers";

/**
 * Handler factories for useInteractiveRebase, split out verbatim so the hook
 * body stays under the line-per-function limit. Each factory takes a plain
 * context of the hook's state/setters and returns the same closures the hook
 * used to define inline; behaviour, including recreation on every render, is
 * unchanged.
 */

export interface StepReorderContext {
  steps: RebasePlanStep[];
  setSteps: (steps: RebasePlanStep[]) => void;
}

export function createStepReorderHandlers({ steps, setSteps }: StepReorderContext) {
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...steps];
    const temp = next[index]!;
    next[index] = next[index - 1]!;
    next[index - 1] = temp;
    setSteps(sanitizeFirstAction(next));
  };

  const handleMoveDown = (index: number) => {
    if (index >= steps.length - 1) return;
    const next = [...steps];
    const temp = next[index]!;
    next[index] = next[index + 1]!;
    next[index + 1] = temp;
    setSteps(sanitizeFirstAction(next));
  };

  return { handleMoveUp, handleMoveDown };
}

export interface StepActionContext {
  steps: RebasePlanStep[];
  setSteps: (steps: RebasePlanStep[]) => void;
  commitMap: Map<string, RebaseCommitItem>;
}

export function createStepActionHandlers({ steps, setSteps, commitMap }: StepActionContext) {
  const handleActionChange = (index: number, action: RebaseActionKind) => {
    const next = [...steps];
    const current = next[index]!;
    next[index] = {
      ...current,
      action,
      new_message:
        action === REBASE_ACTION.REWORD || action === REBASE_ACTION.SQUASH
          ? (current.new_message ?? commitMap.get(current.commit_id)?.message ?? "")
          : null,
    };
    setSteps(sanitizeFirstAction(next));
  };

  const handleMessageChange = (index: number, message: string) => {
    const next = [...steps];
    next[index] = {
      ...next[index]!,
      new_message: message,
    };
    setSteps(next);
  };

  return { handleActionChange, handleMessageChange };
}

export interface ResetContext {
  fetchedCommits: RebaseCommitItem[];
  setSteps: (steps: RebasePlanStep[]) => void;
  setError: (message: string | null) => void;
}

export function createResetHandler({ fetchedCommits, setSteps, setError }: ResetContext) {
  return () => {
    setSteps(commitsToPickSteps(fetchedCommits));
    setError(null);
  };
}

export interface DragAndDropContext {
  steps: RebasePlanStep[];
  setSteps: (steps: RebasePlanStep[]) => void;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
}

export function createDragAndDropHandlers({
  steps,
  setSteps,
  draggedIndex,
  setDraggedIndex,
}: DragAndDropContext) {
  const handleDragStart = (index: number) => (e: DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (_index: number) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetIndex: number) => (e: DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const next = [...steps];
    const [moved] = next.splice(draggedIndex, 1);
    if (moved) {
      next.splice(targetIndex, 0, moved);
      setSteps(sanitizeFirstAction(next));
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return { handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
