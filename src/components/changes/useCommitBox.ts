import { useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";
import type { CommitBoxProps } from "./CommitBox";
import { createAmendToggleHandler, createSubmitHandler, createKeyDownHandler } from "./useCommitBox.actions";

/** Detects a Mac-style keyboard so the shortcut hint matches the platform. */
function getShortcutHint(): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || "");
  return isMac ? "Cmd+Enter" : "Ctrl+Enter";
}

/** Whether the commit button should be enabled given the current form state. */
function computeCanCommit(
  summary: string,
  isAmend: boolean,
  stagedCount: number,
  isLoading: boolean,
  submitting: boolean
): boolean {
  return summary.trim().length > 0 && (isAmend || stagedCount > 0) && !isLoading && !submitting;
}

/**
 * State, derived values and handlers for `CommitBox`. Keeps the component
 * itself down to layout and event wiring.
 */
export function useCommitBox({
  repoPath,
  stagedCount,
  lastCommitMessage,
  onCommit,
  onSuccess,
  isLoading = false,
}: CommitBoxProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [isAmend, setIsAmend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mode = useSettingsStore((s) => s.mode);

  const shortcutHint = getShortcutHint();
  const isOver72 = summary.length > 72;
  const canCommit = computeCanCommit(summary, isAmend, stagedCount, isLoading, submitting);

  const handleAmendToggle = createAmendToggleHandler({
    lastCommitMessage,
    summary,
    setIsAmend,
    setSummary,
    setDescription,
  });

  const handleSubmit = createSubmitHandler({
    canCommit,
    repoPath,
    summary,
    description,
    isAmend,
    onCommit,
    onSuccess,
    t,
    setSubmitting,
    setSummary,
    setDescription,
    setIsAmend,
  });

  const handleKeyDown = createKeyDownHandler(handleSubmit);

  return {
    t,
    mode,
    summary,
    setSummary,
    description,
    setDescription,
    isAmend,
    submitting,
    shortcutHint,
    isOver72,
    canCommit,
    handleAmendToggle,
    handleSubmit,
    handleKeyDown,
  };
}
