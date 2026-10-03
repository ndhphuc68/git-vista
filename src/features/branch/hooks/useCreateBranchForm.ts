import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCreateBranch, useBranches } from "../api";
import { useTranslation } from "../../../i18n";
import { sanitizeBranchName } from "../model/branchName";
import {
  resolveEffectiveTarget,
  resolveInitialBaseRef,
  submitCreateBranch,
} from "./useCreateBranchForm.actions";
import { useCreateBranchConflict } from "./useCreateBranchConflict";

export interface CreateBranchFormOptions {
  isOpen: boolean;
  repoPath: string;
  targetCommit?: string | null;
  sourceBranch?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Form state, sanitization and submit handling for CreateBranchModal. */
export function useCreateBranchForm({
  isOpen,
  repoPath,
  targetCommit,
  sourceBranch,
  onClose,
  onSuccess,
}: CreateBranchFormOptions) {
  const { t } = useTranslation();
  const createBranch = useCreateBranch(repoPath);
  const { data: branchData } = useBranches(repoPath, { enabled: isOpen && Boolean(repoPath) });

  const [branchName, setBranchName] = useState("");
  const [selectedBaseRef, setSelectedBaseRef] = useState<string>("");
  const [checkout, setCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conflict = useCreateBranchConflict({ isOpen, repoPath, onClose, onSuccess, setError });

  const initialBaseRef = useMemo(
    () => resolveInitialBaseRef(sourceBranch, targetCommit, branchData?.remote),
    [sourceBranch, targetCommit, branchData?.remote]
  );

  const initialRefSync = useRef(initialBaseRef);
  initialRefSync.current = initialBaseRef;

  useEffect(() => {
    if (isOpen) {
      setBranchName("");
      setSelectedBaseRef(initialRefSync.current);
      setCheckout(true);
      setError(null);
    }
  }, [isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBranchName(sanitizeBranchName(e.target.value));
    if (error) setError(null);
    conflict.setConflict(false);
  };

  const handleBaseRefChange = (value: string) => {
    setSelectedBaseRef(value);
  };

  const submit = (withCheckout: boolean) =>
    submitCreateBranch({
      trimmed: branchName.trim(),
      selectedBaseRef,
      targetCommit,
      checkout: withCheckout,
      createBranch,
      t,
      onSuccess,
      onClose,
      setError,
      setConflict: conflict.setConflict,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      setError(t.modals.createBranch.errorEmpty);
      return;
    }
    await submit(checkout);
  };

  return {
    t,
    branchData,
    branchName,
    selectedBaseRef,
    setSelectedBaseRef,
    checkout,
    setCheckout,
    error,
    loading: createBranch.isPending || conflict.busy,
    handleNameChange,
    handleBaseRefChange,
    handleSubmit,
    conflictActions: conflict.actionsFor(
      branchName.trim(),
      resolveEffectiveTarget(selectedBaseRef, targetCommit),
      () => submit(false)
    ),
  };
}
