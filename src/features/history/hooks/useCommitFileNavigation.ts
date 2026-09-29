import { useEffect, useMemo, useState } from "react";
import type { CommitFile } from "../api/useCommitDetails";

export function useCommitFileNavigation(
  files: CommitFile[] | undefined,
  selectedFilePath: string | null,
  setSelectedFile: (path: string) => void
) {
  const [fileFilter, setFileFilter] = useState("");

  useEffect(() => {
    const firstFile = files?.[0];
    if (firstFile && !selectedFilePath) setSelectedFile(firstFile.path);
  }, [files, selectedFilePath, setSelectedFile]);

  const filteredFiles = useMemo(() => {
    if (!files) return [];
    if (!fileFilter.trim()) return files;
    const query = fileFilter.toLowerCase();
    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [files, fileFilter]);

  const currentFileIndex = useMemo(() => {
    if (!files || !selectedFilePath) return -1;
    return files.findIndex((file) => file.path === selectedFilePath);
  }, [files, selectedFilePath]);

  const selectedFile = useMemo(() => {
    if (!files || !selectedFilePath) return null;
    return files.find((file) => file.path === selectedFilePath) || null;
  }, [files, selectedFilePath]);

  const hasPrev = currentFileIndex > 0;
  const hasNext = currentFileIndex >= 0 && currentFileIndex < (files?.length ?? 0) - 1;

  const handlePrevFile = () => {
    const prevFile = files?.[currentFileIndex - 1];
    if (hasPrev && prevFile) setSelectedFile(prevFile.path);
  };

  const handleNextFile = () => {
    const nextFile = files?.[currentFileIndex + 1];
    if (hasNext && nextFile) setSelectedFile(nextFile.path);
  };

  return {
    fileFilter,
    setFileFilter,
    filteredFiles,
    currentFileIndex,
    selectedFile,
    hasPrev,
    hasNext,
    handlePrevFile,
    handleNextFile,
  };
}
