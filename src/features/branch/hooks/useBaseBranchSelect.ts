import React, { useState, useEffect, useRef, useMemo } from "react";
import { type BranchItem } from "../../../ipc/bindings.generated";

export interface UseBaseBranchSelectOptions {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  targetCommit?: string | null;
  sourceBranch?: string;
  localBranches: BranchItem[];
  remoteBranches: BranchItem[];
  currentBranchName?: string | null;
  isCommitTarget?: boolean;
}

export function useBaseBranchSelect({
  value,
  onChange,
  targetCommit,
  sourceBranch,
  localBranches,
  remoteBranches,
  currentBranchName,
  isCommitTarget,
}: UseBaseBranchSelectOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const query = search.trim().toLowerCase();
  const filteredLocal = useMemo(
    () => localBranches.filter((b) => !query || b.name.toLowerCase().includes(query)),
    [localBranches, query]
  );
  const filteredRemote = useMemo(
    () => remoteBranches.filter((b) => !query || b.name.toLowerCase().includes(query)),
    [remoteBranches, query]
  );
  const filteredCommit = useMemo(() => {
    if (!isCommitTarget || !targetCommit) return null;
    return !query || targetCommit.toLowerCase().includes(query) ? targetCommit : null;
  }, [isCommitTarget, targetCommit, query]);

  const displayLabel = useMemo(() => {
    if (value) {
      if (value.startsWith("refs/heads/")) return value.replace("refs/heads/", "");
      if (value.startsWith("refs/remotes/")) return value.replace("refs/remotes/", "");
      if (value === targetCommit) return targetCommit.substring(0, 7);
      return value;
    }
    if (sourceBranch) return sourceBranch;
    if (isCommitTarget && targetCommit) return targetCommit.substring(0, 7);
    return currentBranchName || "HEAD";
  }, [value, sourceBranch, isCommitTarget, targetCommit, currentBranchName]);

  const isHeadSelected =
    !value || value === "" || (currentBranchName && value === `refs/heads/${currentBranchName}`);

  const handleSelect = (refValue: string) => {
    setIsOpen(false);
    onChange({ target: { value: refValue } } as React.ChangeEvent<HTMLSelectElement>);
  };

  return {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    containerRef,
    menuRef,
    filteredLocal,
    filteredRemote,
    filteredCommit,
    displayLabel,
    isHeadSelected: Boolean(isHeadSelected),
    handleSelect,
  };
}
