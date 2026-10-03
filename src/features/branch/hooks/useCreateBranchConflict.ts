import { useState, useEffect } from "react";
import { usePopStash, useSaveStash } from "../../stash";
import { useCreateBranch } from "../api";
import { useTranslation } from "../../../i18n";
import { stashAndCreateBranch } from "./useCreateBranchConflict.actions";

export type ConflictAction = "stash" | "createOnly";

/** What CreateBranchModal needs to offer the ways past a checkout conflict. */
export interface ConflictActions {
  pendingAction: ConflictAction | null;
  onStashAndCreate: () => void;
  onCreateOnly: () => void;
}

export interface CreateBranchConflictOptions {
  isOpen: boolean;
  repoPath: string;
  onClose: () => void;
  onSuccess?: () => void;
  setError: (err: string | null) => void;
}

/**
 * The ways out offered when creating a branch hit a checkout conflict:
 * stash and carry the changes onto the new branch, or create it without
 * checking it out.
 */
export function useCreateBranchConflict({
  isOpen,
  repoPath,
  onClose,
  onSuccess,
  setError,
}: CreateBranchConflictOptions) {
  const { t } = useTranslation();
  const createBranch = useCreateBranch(repoPath);
  const saveStash = useSaveStash(repoPath);
  const popStash = usePopStash(repoPath);
  const [conflict, setConflict] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConflictAction | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConflict(false);
      setPendingAction(null);
    }
  }, [isOpen]);

  const run = async (action: ConflictAction, task: () => Promise<void>) => {
    setPendingAction(action);
    try {
      await task();
    } finally {
      setPendingAction(null);
    }
  };

  const stashAndCreate = (name: string, targetCommit?: string) =>
    run("stash", async () => {
      setConflict(false);
      await stashAndCreateBranch({
        name,
        targetCommit,
        saveStash: saveStash.mutateAsync,
        createBranch: createBranch.mutateAsync,
        popStash: popStash.mutateAsync,
        t,
        onSuccess,
        onClose,
        setError,
      });
    });

  /** Null while there is no conflict to offer a way past. */
  const actionsFor = (
    name: string,
    targetCommit: string | undefined,
    createOnly: () => Promise<void>
  ): ConflictActions | null =>
    conflict
      ? {
          pendingAction,
          onStashAndCreate: () => void stashAndCreate(name, targetCommit),
          onCreateOnly: () => void run("createOnly", createOnly),
        }
      : null;

  return { setConflict, busy: pendingAction !== null, actionsFor };
}
