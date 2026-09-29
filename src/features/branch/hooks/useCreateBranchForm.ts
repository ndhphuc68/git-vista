import React, { useState, useEffect } from "react";
import { useCreateBranch } from "../api";
import { useTranslation } from "../../../i18n";
import { sanitizeBranchName } from "../model/branchName";

export interface CreateBranchFormOptions {
  isOpen: boolean;
  repoPath: string;
  targetCommit?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Form state, sanitization and submit handling for CreateBranchModal. */
export function useCreateBranchForm({
  isOpen,
  repoPath,
  targetCommit,
  onClose,
  onSuccess,
}: CreateBranchFormOptions) {
  const { t } = useTranslation();
  const createBranch = useCreateBranch(repoPath);
  const [branchName, setBranchName] = useState("");
  const [checkout, setCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loading = createBranch.isPending;

  useEffect(() => {
    if (isOpen) {
      setBranchName("");
      setCheckout(true);
      setError(null);
    }
  }, [isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeBranchName(e.target.value);
    setBranchName(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) {
      setError(t.modals.createBranch.errorEmpty);
      return;
    }

    setError(null);

    try {
      await createBranch.mutateAsync({
        name: trimmed,
        targetCommit: targetCommit ?? undefined,
        checkout,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
    }
  };

  return {
    t,
    branchName,
    checkout,
    setCheckout,
    error,
    loading,
    handleNameChange,
    handleSubmit,
  };
}
