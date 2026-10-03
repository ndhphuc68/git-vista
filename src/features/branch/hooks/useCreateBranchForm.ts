import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCreateBranch, useBranches } from "../api";
import { useTranslation } from "../../../i18n";
import { sanitizeBranchName } from "../model/branchName";
import { resolveInitialBaseRef, submitCreateBranch } from "./useCreateBranchForm.actions";

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
  };

  const handleBaseRefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBaseRef(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) {
      setError(t.modals.createBranch.errorEmpty);
      return;
    }
    await submitCreateBranch({
      trimmed,
      selectedBaseRef,
      targetCommit,
      checkout,
      createBranch,
      t,
      onSuccess,
      onClose,
      setError,
    });
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
    loading: createBranch.isPending,
    handleNameChange,
    handleBaseRefChange,
    handleSubmit,
  };
}
