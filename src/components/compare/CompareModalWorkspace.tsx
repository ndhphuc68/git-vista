import React from "react";
import { CompareFileList } from "./CompareFileList";
import { CompareCommitList } from "./CompareCommitList";
import { CompareDiffViewer } from "./CompareDiffViewer";
import { CompareTabBar } from "./CompareTabBar";
import type {
  CompareMode,
  CompareCommitItem,
  CompareFileItem,
  CompareSummary,
} from "../../ipc/bindings.generated";

const EMPTY_COMMITS: CompareCommitItem[] = [];
const EMPTY_FILES: CompareFileItem[] = [];

interface CompareModalWorkspaceProps {
  repoPath: string;
  baseRev: string;
  targetRev: string;
  mode: CompareMode;
  summary?: CompareSummary | null;
  isLoading: boolean;
  activeTab: "commits" | "files";
  onSelectTab: (tab: "commits" | "files") => void;
  selectedFile: CompareFileItem | null;
  onSelectFile: (file: CompareFileItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/** The 2-column workspace below CompareHeader: tabbed file/commit list plus the diff viewer. */
export const CompareModalWorkspace: React.FC<CompareModalWorkspaceProps> = ({
  repoPath,
  baseRev,
  targetRev,
  mode,
  summary,
  isLoading,
  activeTab,
  onSelectTab,
  selectedFile,
  onSelectFile,
  searchQuery,
  onSearchChange,
}) => (
  <div className="flex-1 flex min-h-0 divide-x divide-border-subtle overflow-hidden">
    {/* Left Column: Navigation Tabs & Content (Commits or Files) */}
    <div className="w-80 md:w-96 flex flex-col bg-surface-subtle shrink-0 overflow-hidden">
      <CompareTabBar
        activeTab={activeTab}
        filesCount={summary?.files.length ?? 0}
        commitsCount={summary?.commits.length ?? 0}
        onSelectTab={onSelectTab}
      />

      {/* Tab body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "files" ? (
          <CompareFileList
            files={summary?.files ?? EMPTY_FILES}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isLoading={isLoading}
          />
        ) : (
          <CompareCommitList commits={summary?.commits ?? EMPTY_COMMITS} isLoading={isLoading} />
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
);
