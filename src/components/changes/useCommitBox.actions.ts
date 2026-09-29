import type { CommitDetails } from "../../ipc/bindings.generated";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { createCommit } from "../../features/changes";
import { undoCommit } from "../../features/undo";
import type { useTranslation } from "../../i18n";
import type { CommitBoxProps } from "./CommitBox";

export interface AmendToggleContext {
  lastCommitMessage: CommitBoxProps["lastCommitMessage"];
  summary: string;
  setIsAmend: (value: boolean) => void;
  setSummary: (value: string) => void;
  setDescription: (value: string) => void;
}

/** Toggling amend pre-fills the form from `lastCommitMessage` when it is still empty. */
export function createAmendToggleHandler(ctx: AmendToggleContext) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    ctx.setIsAmend(checked);

    if (checked && ctx.lastCommitMessage && ctx.summary.trim() === "") {
      const parts = ctx.lastCommitMessage.split("\n\n");
      const firstLine = parts[0] ? parts[0].trim() : "";
      const remaining = parts.slice(1).join("\n\n").trim();
      ctx.setSummary(firstLine);
      ctx.setDescription(remaining);
    }
  };
}

export interface SubmitContext {
  canCommit: boolean;
  repoPath: string;
  summary: string;
  description: string;
  isAmend: boolean;
  onCommit: CommitBoxProps["onCommit"];
  onSuccess: CommitBoxProps["onSuccess"];
  t: ReturnType<typeof useTranslation>["t"];
  setSubmitting: (value: boolean) => void;
  setSummary: (value: string) => void;
  setDescription: (value: string) => void;
  setIsAmend: (value: boolean) => void;
}

/** Submits the form through `onCommit` (or `createCommit` directly), then resets it. */
export function createSubmitHandler(ctx: SubmitContext) {
  return async () => {
    if (!ctx.canCommit) return;

    try {
      ctx.setSubmitting(true);
      let result: CommitDetails | void;
      if (ctx.onCommit) {
        result = await ctx.onCommit(
          ctx.summary.trim(),
          ctx.description.trim() ? ctx.description.trim() : undefined,
          ctx.isAmend
        );
      } else {
        result = await createCommit(
          ctx.repoPath,
          ctx.summary.trim(),
          ctx.description.trim() ? ctx.description.trim() : undefined,
          ctx.isAmend
        );
      }

      useToastStore.getState().showToast({
        message: ctx.isAmend ? ctx.t.commit.amendSuccess : ctx.t.commit.commitSuccess,
        type: "success",
        durationMs: 10000,
        undoAction: result?.undo_token
          ? async () => {
              await undoCommit(ctx.repoPath, result.undo_token!);
              if (ctx.onSuccess) ctx.onSuccess();
            }
          : undefined,
      });

      ctx.setSummary("");
      ctx.setDescription("");
      ctx.setIsAmend(false);
      if (ctx.onSuccess) ctx.onSuccess();
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      ctx.setSubmitting(false);
    }
  };
}

/** Cmd/Ctrl+Enter submits the form from either the summary or description field. */
export function createKeyDownHandler(handleSubmit: () => void) {
  return (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };
}
