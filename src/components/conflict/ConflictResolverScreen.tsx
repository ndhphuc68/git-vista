import React, { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { ConflictFileData } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";

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
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["conflict_file_data", repoPath, filePath],
    queryFn: () => invokeCommand.getConflictFileData(repoPath, filePath),
    enabled: !conflictData && Boolean(repoPath) && Boolean(filePath),
  });

  const fileData = conflictData || data;

  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const conflictHunks = useMemo(() => {
    return fileData?.hunks.filter((h) => h.is_conflict) || [];
  }, [fileData]);

  const hunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const totalConflicts = conflictHunks.length;
  const resolvedCount = useMemo(() => {
    return conflictHunks.filter((h) => resolutions[h.id] !== undefined).length;
  }, [conflictHunks, resolutions]);

  const handleSetResolution = (hunkId: string, value: string) => {
    setResolutions((prev) => ({ ...prev, [hunkId]: value }));
  };

  const handleTakeAllOurs = () => {
    const next: Record<string, string> = { ...resolutions };
    conflictHunks.forEach((h) => {
      next[h.id] = h.ours || "";
    });
    setResolutions(next);
  };

  const handleTakeAllTheirs = () => {
    const next: Record<string, string> = { ...resolutions };
    conflictHunks.forEach((h) => {
      next[h.id] = h.theirs || "";
    });
    setResolutions(next);
  };

  const scrollToConflict = (index: number) => {
    if (index >= 0 && index < conflictHunks.length) {
      setCurrentConflictIndex(index);
      const targetId = conflictHunks[index]?.id;
      if (targetId && hunkRefs.current[targetId]) {
        hunkRefs.current[targetId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handlePrevConflict = () => {
    if (currentConflictIndex > 0) {
      scrollToConflict(currentConflictIndex - 1);
    }
  };

  const handleNextConflict = () => {
    if (currentConflictIndex < conflictHunks.length - 1) {
      scrollToConflict(currentConflictIndex + 1);
    }
  };

  const handleSave = async () => {
    if (!fileData) return;
    const unresolvedCount = totalConflicts - resolvedCount;
    if (unresolvedCount > 0) {
      const confirmSave =
        typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm(
              t.conflictResolver.unresolvedWarning.replace("{count}", String(unresolvedCount))
            )
          : true;
      if (!confirmSave) return;
    }

    let finalText = "";
    for (const hunk of fileData.hunks) {
      if (!hunk.is_conflict) {
        finalText += hunk.content || "";
      } else {
        finalText += resolutions[hunk.id] ?? "";
      }
    }

    setIsSaving(true);
    try {
      await onSaveAndStage(finalText);
    } finally {
      setIsSaving(false);
    }
  };

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
      {/* Sticky Header Toolbar */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface z-10 gap-3">
        {/* Left: Back button & file info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded-sm border border-border-subtle transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t.conflictResolver.back}</span>
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs text-primary truncate" title={filePath}>
              {filePath}
            </span>
            <span
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                resolvedCount === totalConflicts
                  ? "bg-diff-add-bg text-diff-add-text"
                  : "bg-diff-remove-bg text-diff-remove-text"
              }`}
            >
              {t.conflictResolver.progress
                .replace("{resolved}", String(resolvedCount))
                .replace("{total}", String(totalConflicts))}
            </span>
          </div>
        </div>

        {/* Center: Navigation & Batch Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border-subtle rounded-sm overflow-hidden bg-surface">
            <button
              type="button"
              onClick={handlePrevConflict}
              disabled={currentConflictIndex <= 0}
              className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={t.conflictResolver.prevConflict}
            >
              <ChevronUp size={13} />
              <span>{t.conflictResolver.prevConflict}</span>
            </button>
            <div className="w-[1px] h-4 bg-border-subtle" />
            <button
              type="button"
              onClick={handleNextConflict}
              disabled={currentConflictIndex >= totalConflicts - 1}
              className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={t.conflictResolver.nextConflict}
            >
              <span>{t.conflictResolver.nextConflict}</span>
              <ChevronDown size={13} />
            </button>
          </div>

          <button
            type="button"
            aria-label={t.conflictResolver.takeAllOursAria}
            onClick={handleTakeAllOurs}
            className="px-2.5 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded-sm border border-border-subtle transition-colors cursor-pointer"
          >
            {t.conflictResolver.takeAllOurs}
          </button>

          <button
            type="button"
            aria-label={t.conflictResolver.takeAllTheirsAria}
            onClick={handleTakeAllTheirs}
            className="px-2.5 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded-sm border border-border-subtle transition-colors cursor-pointer"
          >
            {t.conflictResolver.takeAllTheirs}
          </button>
        </div>

        {/* Right: Save & Stage */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-accent text-white hover:bg-accent-hover active:opacity-90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <Check size={14} />
            <span>{isSaving ? t.conflictResolver.saving : t.conflictResolver.complete}</span>
          </button>
        </div>
      </header>

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
        {fileData?.hunks.map((hunk, idx) => {
          if (!hunk.is_conflict) {
            return (
              <div
                key={hunk.id || `hunk_${idx}`}
                className="w-full bg-surface-subtle/30 px-4 py-1.5 border-b border-border-subtle/50 font-mono text-xs text-secondary whitespace-pre-wrap select-text leading-relaxed"
              >
                {hunk.content}
              </div>
            );
          }

          const isResolved = resolutions[hunk.id] !== undefined;

          return (
            <div
              key={hunk.id}
              ref={(el) => {
                hunkRefs.current[hunk.id] = el;
              }}
              className="w-full border-b-2 border-border-strong bg-surface"
            >
              {/* Conflict Hunk 3 Columns */}
              <div className="grid grid-cols-3 min-h-[140px]">
                {/* Column 1: Ours */}
                <div className="flex flex-col border-r border-border-subtle bg-diff-add-bg/15">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-diff-add-bg/30">
                    <span className="text-[11px] font-semibold text-diff-add-text truncate">
                      {hunk.ours_label || "HEAD"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetResolution(hunk.id, hunk.ours || "")}
                      className="px-2 py-0.5 text-[11px] font-medium bg-diff-add-bg text-diff-add-text border border-diff-add-border rounded-sm hover:brightness-95 transition-all cursor-pointer"
                    >
                      {t.conflictResolver.acceptOurs}
                    </button>
                  </div>
                  <pre className="flex-1 p-3 font-mono text-xs text-diff-add-text whitespace-pre-wrap overflow-x-auto select-text">
                    {hunk.ours || ""}
                  </pre>
                </div>

                {/* Column 2: Merged Result & Manual Edit */}
                <div className="flex flex-col border-r border-border-subtle bg-surface">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-surface-subtle">
                    <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                      {isResolved ? (
                        <span className="text-diff-add-text font-bold">{t.conflictResolver.selectedBadge}</span>
                      ) : (
                        <span className="text-secondary font-normal italic">{t.conflictResolver.unselectedBadge}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSetResolution(
                          hunk.id,
                          (hunk.ours || "") + (hunk.theirs || "")
                        )
                      }
                      className="px-2 py-0.5 text-[11px] font-medium bg-surface text-secondary hover:text-primary border border-border-subtle rounded-sm hover:bg-surface-hover transition-all cursor-pointer"
                    >
                      {t.conflictResolver.takeBoth}
                    </button>
                  </div>
                  <textarea
                    rows={Math.max(
                      3,
                      (resolutions[hunk.id] ?? (hunk.ours || "")).split("\n").length
                    )}
                    value={resolutions[hunk.id] ?? ""}
                    onChange={(e) => handleSetResolution(hunk.id, e.target.value)}
                    placeholder={t.conflictResolver.editorPlaceholder}
                    className="flex-1 w-full p-3 font-mono text-xs text-primary bg-transparent focus:outline-none focus:bg-surface-subtle/40 resize-y"
                  />
                </div>

                {/* Column 3: Theirs */}
                <div className="flex flex-col bg-accent-subtle/20">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-accent-subtle/40">
                    <span className="text-[11px] font-semibold text-primary truncate">
                      {hunk.theirs_label || "THEIRS"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetResolution(hunk.id, hunk.theirs || "")}
                      className="px-2 py-0.5 text-[11px] font-medium bg-accent-subtle text-primary border border-border-subtle rounded-sm hover:brightness-95 transition-all cursor-pointer"
                    >
                      {t.conflictResolver.acceptTheirs}
                    </button>
                  </div>
                  <pre className="flex-1 p-3 font-mono text-xs text-primary whitespace-pre-wrap overflow-x-auto select-text">
                    {hunk.theirs || ""}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ConflictResolverScreen: React.FC<ConflictResolverScreenProps> = (props) => {
  let hasClient = true;
  try {
    useQueryClient();
  } catch {
    hasClient = false;
  }

  if (!hasClient) {
    return (
      <QueryClientProvider client={defaultFallbackQueryClient}>
        <ConflictResolverInner {...props} />
      </QueryClientProvider>
    );
  }

  return <ConflictResolverInner {...props} />;
};