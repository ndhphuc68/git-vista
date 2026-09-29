import React, { useContext } from "react";
import { QueryClient, QueryClientContext, QueryClientProvider } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { type ConflictFileData } from "../../features/conflict";
import { useConflictResolver } from "./useConflictResolver";
import { ConflictResolverToolbar } from "./ConflictResolverToolbar";
import { ConflictHunkRow } from "./ConflictHunkRow";

export interface ConflictResolverScreenProps {
  filePath: string;
  repoPath: string;
  conflictData?: ConflictFileData;
  onBack: () => void;
  onSaveAndStage: (resolvedContent: string) => Promise<void>;
}

const defaultFallbackQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const ConflictResolverInner: React.FC<ConflictResolverScreenProps> = ({
  filePath,
  repoPath,
  conflictData,
  onBack,
  onSaveAndStage,
}) => {
  const {
    t,
    isLoading,
    fileData,
    resolutions,
    currentConflictIndex,
    isSaving,
    totalConflicts,
    resolvedCount,
    handleSetResolution,
    handleTakeAllOurs,
    handleTakeAllTheirs,
    handlePrevConflict,
    handleNextConflict,
    handleSave,
    registerHunkRef,
  } = useConflictResolver({ filePath, repoPath, conflictData, onSaveAndStage });

  if (isLoading && !fileData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-surface text-secondary gap-3">
        <RefreshCw size={24} className="animate-spin text-accent" />
        <span className="text-sm">{t.conflictResolver.loading}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-hidden">
      <ConflictResolverToolbar
        t={t}
        filePath={filePath}
        totalConflicts={totalConflicts}
        resolvedCount={resolvedCount}
        currentConflictIndex={currentConflictIndex}
        isSaving={isSaving}
        onBack={onBack}
        onPrevConflict={handlePrevConflict}
        onNextConflict={handleNextConflict}
        onTakeAllOurs={handleTakeAllOurs}
        onTakeAllTheirs={handleTakeAllTheirs}
        onSave={handleSave}
      />

      {/* 3-Column Header Bar */}
      <div className="grid grid-cols-3 border-b border-border-subtle bg-surface-subtle shrink-0 text-xs font-semibold text-secondary">
        <div className="px-4 py-2 border-r border-border-subtle flex items-center justify-between">
          <span>{t.conflictResolver.oursHeader}</span>
        </div>
        <div className="px-4 py-2 border-r border-border-subtle flex items-center justify-between">
          <span>{t.conflictResolver.mergedHeader}</span>
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <span>{t.conflictResolver.theirsHeader}</span>
        </div>
      </div>

      {/* Main Diff & Conflict Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {fileData?.hunks.map((hunk, idx) => (
          <ConflictHunkRow
            key={hunk.id || `hunk_${idx}`}
            t={t}
            hunk={hunk}
            idx={idx}
            isResolved={resolutions[hunk.id] !== undefined}
            resolutionValue={resolutions[hunk.id]}
            onSetResolution={handleSetResolution}
            registerHunkRef={registerHunkRef}
          />
        ))}
      </div>
    </div>
  );
};

export const ConflictResolverScreen: React.FC<ConflictResolverScreenProps> = (props) => {
  const queryClient = useContext(QueryClientContext);

  if (!queryClient) {
    return (
      <QueryClientProvider client={defaultFallbackQueryClient}>
        <ConflictResolverInner {...props} />
      </QueryClientProvider>
    );
  }

  return <ConflictResolverInner {...props} />;
};
