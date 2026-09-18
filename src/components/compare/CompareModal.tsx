import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useRepoStore } from "../../store/useRepoStore";
import { CompareHeader } from "./CompareHeader";
import { CompareCommitList } from "./CompareCommitList";
import { CompareFileList } from "./CompareFileList";
import { CompareDiffViewer } from "./CompareDiffViewer";
import type {
  CompareMode,
  CompareCommitItem,
  CompareFileItem,
} from "../../ipc/bindings";

const EMPTY_COMMITS: CompareCommitItem[] = [];
const EMPTY_FILES: CompareFileItem[] = [];

export interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath?: string;
  initialBaseRev?: string;
  initialTargetRev?: string;
  initialMode?: CompareMode;
  branches?: Array<{ name: string; is_head?: boolean }>;
  tags?: Array<{ name: string }>;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  repoPath: propRepoPath,
  initialBaseRev,
  initialTargetRev,
  initialMode = "MergeBase",
  branches = [],
  tags = [],
}) => {
  const { t } = useTranslation();
  const currentRepo = useRepoStore((s) => s.currentRepo);
  const repoPath = propRepoPath || currentRepo?.path || "";

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
  const { data: summary, isLoading } = useQuery({
    queryKey: ["compare-summary", repoPath, baseRev, targetRev, mode],
    queryFn: () => invokeCommand.compareCommits(repoPath, baseRev, targetRev, mode),
    enabled: isOpen && Boolean(repoPath) && Boolean(baseRev) && Boolean(targetRev),
  });

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

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSwap = () => {
    const temp = baseRev;
    setBaseRev(targetRev);
    setTargetRev(temp);
  };

  if (!isOpen) return null;

  const commitsCount = summary?.commits.length ?? 0;
  const filesCount = summary?.files.length ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.compare.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="flex flex-col w-full max-w-6xl h-[88vh] bg-surface rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Base/Target inputs & Swap button & Mode toggle */}
        <CompareHeader
          baseRev={baseRev}
          targetRev={targetRev}
          mode={mode}
          onBaseRevChange={setBaseRev}
          onTargetRevChange={setTargetRev}
          onModeChange={setMode}
          onSwap={handleSwap}
          onClose={onClose}
          branches={branches}
          tags={tags}
          summary={summary}
          isLoading={isLoading}
        />

        {/* 2-Column Main Workspace */}
        <div className="flex-1 flex min-h-0 divide-x divide-border-subtle overflow-hidden">
          {/* Left Column: Navigation Tabs & Content (Commits or Files) */}
          <div className="w-80 md:w-96 flex flex-col bg-surface-subtle shrink-0 overflow-hidden">
            {/* Tab header */}
            <div className="flex border-b border-border-subtle bg-surface shrink-0 select-none">
              <button
                type="button"
                onClick={() => setActiveTab("files")}
                className={clsx(
                  "flex-1 py-2.5 px-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer",
                  activeTab === "files"
                    ? "border-accent text-accent bg-accent/5"
                    : "border-transparent text-secondary hover:text-primary hover:bg-surface-hover"
                )}
              >
                {t.compare.tabFiles.replace("{count}", String(filesCount))}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("commits")}
                className={clsx(
                  "flex-1 py-2.5 px-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer",
                  activeTab === "commits"
                    ? "border-accent text-accent bg-accent/5"
                    : "border-transparent text-secondary hover:text-primary hover:bg-surface-hover"
                )}
              >
                {t.compare.tabCommits.replace("{count}", String(commitsCount))}
              </button>
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "files" ? (
                <CompareFileList
                  files={summary?.files ?? EMPTY_FILES}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isLoading={isLoading}
                />
              ) : (
                <CompareCommitList
                  commits={summary?.commits ?? EMPTY_COMMITS}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>

          {/* Right Column: Diff Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-window overflow-hidden">
            <CompareDiffViewer
              repoPath={repoPath}
              baseRev={baseRev}
              targetRev={targetRev}
              file={selectedFile}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
