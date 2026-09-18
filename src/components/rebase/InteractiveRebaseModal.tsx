import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  RotateCcw,
  Play,
  Loader2,
  GitBranch,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { Transition } from "../common/Transition";
import { RebaseCommitRow } from "./RebaseCommitRow";
import { RebaseLivePreview } from "./RebaseLivePreview";
import type {
  RebaseCommitItem,
  RebasePlanStep,
  RebaseActionKind,
  InteractiveRebaseResult,
} from "../../ipc/bindings";

const EMPTY_COMMITS: RebaseCommitItem[] = [];

export interface InteractiveRebaseModalProps {
  isOpen: boolean;
  baseCommitId: string;
  baseCommitSummary?: string;
  repoPath?: string;
  onClose: () => void;
  onRebaseSuccess?: (result: InteractiveRebaseResult) => void;
}

export const InteractiveRebaseModal: React.FC<InteractiveRebaseModalProps> = ({
  isOpen,
  baseCommitId,
  baseCommitSummary,
  repoPath: propRepoPath,
  onClose,
  onRebaseSuccess,
}) => {
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
  const {
    data: fetchedCommits = EMPTY_COMMITS,
    isLoading,
  } = useQuery({
    queryKey: ["rebase-commits", repoPath, baseCommitId],
    queryFn: () => invokeCommand.getRebaseCommits(repoPath, baseCommitId),
    enabled: isOpen && Boolean(repoPath) && Boolean(baseCommitId),
  });

  // Initialize steps whenever new commits arrive
  useEffect(() => {
    if (fetchedCommits.length > 0) {
      setSteps(
        fetchedCommits.map((c) => ({
          commit_id: c.id,
          action: "Pick",
          new_message: null,
        }))
      );
    } else {
      setSteps([]);
    }
  }, [fetchedCommits]);

  // Map of commit_id -> commit details
  const commitMap = useMemo(() => {
    const map = new Map<string, RebaseCommitItem>();
    for (const c of fetchedCommits) {
      map.set(c.id, c);
    }
    return map;
  }, [fetchedCommits]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  // Sanitize index 0 action: cannot be Squash or Fixup
  const sanitizeFirstAction = (updatedSteps: RebasePlanStep[]): RebasePlanStep[] => {
    if (updatedSteps.length === 0) return updatedSteps;
    const firstNonDroppedIdx = updatedSteps.findIndex((s) => s.action !== "Drop");
    if (
      firstNonDroppedIdx !== -1 &&
      (updatedSteps[firstNonDroppedIdx]!.action === "Squash" ||
        updatedSteps[firstNonDroppedIdx]!.action === "Fixup")
    ) {
      const copy = [...updatedSteps];
      copy[firstNonDroppedIdx] = {
        ...copy[firstNonDroppedIdx]!,
        action: "Pick",
      };
      return copy;
    }
    return updatedSteps;
  };

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

  const handleActionChange = (index: number, action: RebaseActionKind) => {
    const next = [...steps];
    const current = next[index]!;
    next[index] = {
      ...current,
      action,
      new_message:
        action === "Reword" || action === "Squash"
          ? current.new_message ?? commitMap.get(current.commit_id)?.message ?? ""
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

  const handleReset = () => {
    setSteps(
      fetchedCommits.map((c) => ({
        commit_id: c.id,
        action: "Pick",
        new_message: null,
      }))
    );
    setError(null);
  };

  // Drag and drop
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (_index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
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

  // Validation
  const nonDropped = steps.filter((s) => s.action !== "Drop");
  const isAllDropped = steps.length > 0 && nonDropped.length === 0;
  const canSubmit = steps.length > 0 && !isAllDropped && !submitting && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);

    // Validate messages
    for (const s of steps) {
      if ((s.action === "Reword" || s.action === "Squash") && (!s.new_message || s.new_message.trim() === "")) {
        setError(t.modals.interactiveRebase.validation.emptyMessage);
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await invokeCommand.executeInteractiveRebase(
        repoPath,
        baseCommitId,
        steps,
        autoStash
      );

      if (result.success) {
        // Success Toast with Undo capability
        if (result.undo_token) {
          const undoToken = result.undo_token;
          useToastStore.getState().showSuccess(
            t.modals.interactiveRebase.successToast,
            async () => {
              try {
                await invokeCommand.undoCommit(repoPath, undoToken);
                useToastStore
                  .getState()
                  .showSuccess(t.modals.interactiveRebase.undoSuccessToast);
              } catch (err: any) {
                useToastStore
                  .getState()
                  .showError(err?.message || "Failed to undo rebase");
              }
            },
            t.toast.undo
          );
        } else {
          useToastStore.getState().showSuccess(t.modals.interactiveRebase.successToast);
        }

        onRebaseSuccess?.(result);
        onClose();
      } else if (result.status === "Conflict") {
        useToastStore
          .getState()
          .showToast({ type: "error", message: t.modals.interactiveRebase.conflictToast });
        setActiveScreen("changes");
        onClose();
      } else {
        setError(result.output || t.modals.interactiveRebase.errorToast.replace("{msg}", result.status));
      }
    } catch (err: any) {
      setError(err?.message || t.modals.interactiveRebase.errorToast.replace("{msg}", String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} duration={150}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interactive-rebase-title"
      >
        <div
          className="relative w-full max-w-5xl h-[85vh] bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <GitBranch size={16} />
              </div>
              <div>
                <h2
                  id="interactive-rebase-title"
                  className="text-base font-semibold text-primary flex items-center gap-2"
                >
                  {t.modals.interactiveRebase.title}
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  {t.modals.interactiveRebase.subtitle.replace(
                    "{base}",
                    `${baseCommitId.slice(0, 7)}${
                      baseCommitSummary ? ` (${baseCommitSummary})` : ""
                    }`
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-30"
            >
              <X size={16} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-fade-in shrink-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-wrap font-mono text-[11px]">
                {error}
              </div>
            </div>
          )}

          {/* Main 2-Column Body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
            {/* Left Column: Rebase Plan List */}
            <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-surface">
              {/* Tip info bar */}
              <div className="px-4 py-2 bg-surface-subtle/50 border-b border-border-subtle flex items-center justify-between text-[11px] text-secondary shrink-0">
                <span className="flex items-center gap-1.5">
                  <Info size={12} className="text-accent" />
                  {t.modals.interactiveRebase.dragHandleTooltip}
                </span>
                <span className="font-mono">{steps.length} commits</span>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-secondary">
                    <Loader2 size={20} className="animate-spin text-accent" />
                    <span className="text-xs">
                      {t.modals.interactiveRebase.loadingCommits}
                    </span>
                  </div>
                ) : steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-secondary text-xs">
                    <span>{t.modals.interactiveRebase.noCommits}</span>
                  </div>
                ) : (
                  steps.map((step, index) => {
                    const commit = commitMap.get(step.commit_id);
                    if (!commit) return null;
                    return (
                      <RebaseCommitRow
                        key={step.commit_id}
                        step={step}
                        commit={commit}
                        index={index}
                        total={steps.length}
                        onMoveUp={() => handleMoveUp(index)}
                        onMoveDown={() => handleMoveDown(index)}
                        onActionChange={(action) => handleActionChange(index, action)}
                        onMessageChange={(msg) => handleMessageChange(index, msg)}
                        isDragging={draggedIndex === index}
                        onDragStart={handleDragStart(index)}
                        onDragOver={handleDragOver(index)}
                        onDrop={handleDrop(index)}
                        onDragEnd={handleDragEnd}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Live Preview Panel */}
            <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-surface-subtle/30">
              <RebaseLivePreview
                baseCommitId={baseCommitId}
                baseCommitSummary={baseCommitSummary}
                steps={steps}
                commitMap={commitMap}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border-subtle bg-surface-subtle/50 shrink-0">
            {/* Auto-stash toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoStash}
                onChange={(e) => setAutoStash(e.target.checked)}
                className="rounded border-border-strong text-accent focus:ring-accent/30 w-3.5 h-3.5"
              />
              <span className="text-xs text-primary font-medium">
                {t.modals.interactiveRebase.autoStash}
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting || isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw size={12} />
                <span>{t.modals.interactiveRebase.resetBtn}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
              >
                {t.modals.interactiveRebase.cancelBtn}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t.modals.interactiveRebase.rebasing}</span>
                  </>
                ) : (
                  <>
                    <Play size={13} className="fill-current" />
                    <span>{t.modals.interactiveRebase.startBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
