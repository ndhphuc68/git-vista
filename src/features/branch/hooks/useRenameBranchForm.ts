import React, { useState, useEffect, useRef } from "react";
import { useRenameBranch } from "../api";
import { useTranslation } from "../../../i18n";
import { sanitizeBranchName } from "../model/branchName";
import { toErrorMessage } from "../../../shared/utils/toError";

export interface RenameBranchFormOptions {
  isOpen: boolean;
  repoPath: string;
  currentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Form state, focus/select-on-open behaviour and submit handling for RenameBranchModal. */
export function useRenameBranchForm({
  isOpen,
  repoPath,
  currentName,
  onClose,
  onSuccess,
}: RenameBranchFormOptions) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const renameBranch = useRenameBranch(repoPath);
  const [error, setError] = useState<string | null>(null);
  const loading = renameBranch.isPending;
  const inputRef = useRef<HTMLInputElement>(null);
  // One-shot latch: the prefilled name is selected once per opening. Without
  // it the effect below re-selects on every keystroke, so the next character
  // typed would wipe what the user had just typed.
  const hasSelectedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      hasSelectedRef.current = false;
    }
  }, [isOpen, currentName]);

  // Modal's data-autofocus focuses this field, but it fires while the value
  // is still empty — React fills it in the same commit, which collapses the
  // selection to the end. The old implementation dodged that with a 50ms
  // timer. Selecting once the value has actually landed does the same thing
  // without one, so typing still replaces the name outright.
  useEffect(() => {
    if (!isOpen || hasSelectedRef.current) return;
    const input = inputRef.current;
    if (input && input.value && document.activeElement === input) {
      hasSelectedRef.current = true;
      input.select();
    }
  }, [isOpen, newName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeBranchName(e.target.value);
    setNewName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t.modals.renameBranch.errorEmpty);
      return;
    }
    if (trimmed === currentName) {
      setError(t.modals.renameBranch.errorSame);
      return;
    }

    setError(null);

    try {
      await renameBranch.mutateAsync({ oldName: currentName, newName: trimmed });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg || t.common.error);
    }
  };

  return {
    t,
    newName,
    error,
    loading,
    inputRef,
    handleNameChange,
    handleSubmit,
  };
}
