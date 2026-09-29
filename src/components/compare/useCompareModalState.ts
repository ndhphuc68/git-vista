import { useState, useEffect } from "react";
import type { CompareMode, CompareFileItem } from "../../ipc/bindings.generated";
import { useCompareSummary } from "../../features/compare";

interface UseCompareModalStateArgs {
  repoPath: string;
  isOpen: boolean;
  initialBaseRev?: string;
  initialTargetRev?: string;
  initialMode: CompareMode;
}

/** All state, effects and derived values CompareModal's JSX reads. */
export function useCompareModalState({
  repoPath,
  isOpen,
  initialBaseRev,
  initialTargetRev,
  initialMode,
}: UseCompareModalStateArgs) {
  const [baseRev, setBaseRev] = useState(initialBaseRev || "main");
  const [targetRev, setTargetRev] = useState(initialTargetRev || "HEAD");
  const [mode, setMode] = useState<CompareMode>(initialMode);
  const [activeTab, setActiveTab] = useState<"commits" | "files">("files");
  const [selectedFile, setSelectedFile] = useState<CompareFileItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync initial revs when opening
  useEffect(() => {
    if (isOpen) {
      if (initialBaseRev) setBaseRev(initialBaseRev);
      if (initialTargetRev) setTargetRev(initialTargetRev);
      if (initialMode) setMode(initialMode);
    }
  }, [isOpen, initialBaseRev, initialTargetRev, initialMode]);

  // Query comparison summary
  const { data: summary, isLoading } = useCompareSummary(repoPath, baseRev, targetRev, mode, isOpen);

  // Sync selected file when files change
  useEffect(() => {
    if (summary?.files && summary.files.length > 0) {
      setSelectedFile((prev) => {
        if (!prev) return summary.files[0] ?? null;
        const exists = summary.files.find((f) => f.path === prev.path);
        return exists ?? summary.files[0] ?? null;
      });
    } else {
      setSelectedFile(null);
    }
  }, [summary?.files]);

  const handleSwap = () => {
    const temp = baseRev;
    setBaseRev(targetRev);
    setTargetRev(temp);
  };

  const commitsCount = summary?.commits.length ?? 0;
  const filesCount = summary?.files.length ?? 0;

  return {
    baseRev,
    setBaseRev,
    targetRev,
    setTargetRev,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    selectedFile,
    setSelectedFile,
    searchQuery,
    setSearchQuery,
    handleSwap,
    summary,
    isLoading,
    commitsCount,
    filesCount,
  };
}
