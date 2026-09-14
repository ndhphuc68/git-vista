import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FolderGit2,
  FolderOpen,
  Download,
  Clock,
  ArrowRight,
  AlertCircle,
  Trash2,
  X,
  Search,
  GitBranch,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";
import { CloneModal } from "./CloneModal";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRepo,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: recents = [], isLoading } = useQuery({
    queryKey: ["recent-repos"],
    queryFn: () => invokeCommand.getRecentRepos(),
  });

  const handleOpenFolder = async () => {
    try {
      setError(null);
      const path = await invokeCommand.selectRepoFolder();
      if (path) {
        const summary = await invokeCommand.openRepository(path);
        onSelectRepo(summary);
      }
    } catch (err: any) {
      setError(err?.message || t.welcome.errorOpen);
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      setError(null);
      const summary = await invokeCommand.openRepository(path);
      onSelectRepo(summary);
    } catch (err: any) {
      setError(err?.message || `${t.welcome.errorRecent}${path}`);
    }
  };

  const handleClearRecents = async () => {
    try {
      await invokeCommand.clearRecentRepos();
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Error clearing recents:", err);
    }
  };

  const handleRemoveRecent = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await invokeCommand.removeRecentRepo(path);
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Error removing recent repo:", err);
    }
  };

  // Keyboard shortcuts local to WelcomeScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        if (e.key === "Escape") {
          target.blur();
          setSearchQuery("");
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleOpenFolder();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsCloneOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter recents based on search input
  const filteredRecents = useMemo(() => {
    if (!searchQuery.trim()) return recents;
    const q = searchQuery.toLowerCase().trim();
    return recents.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );
  }, [recents, searchQuery]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        const droppedPath = (file as any).path || file.name;
        if (droppedPath) {
          handleOpenRecent(droppedPath);
        }
      }
    }
  };

  return (
    <div
      data-testid="welcome-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center h-full w-full bg-window overflow-y-auto px-6 py-8 select-none transition-colors duration-200 ${
        isDragging ? "ring-2 ring-accent ring-inset bg-accent-subtle/30" : ""
      }`}
    >
      <div className="w-full max-w-[880px] flex flex-col gap-6 my-auto animate-fade">
        {/* Hero Branding */}
        <header className="text-center flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle shadow-md flex items-center justify-center text-accent transition-transform duration-200 group-hover:scale-105">
              <FolderGit2 size={34} className="text-accent" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              GitVista
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
              v0.1
            </span>
          </div>
          <p className="text-secondary text-sm mt-1.5 max-w-lg">
            {t.welcome.tagline}
          </p>
        </header>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="px-4 py-3 bg-diff-remove-bg text-diff-remove-text rounded-xl text-sm border border-diff-remove-border flex items-center gap-2.5 shadow-xs"
          >
            <AlertCircle size={18} className="shrink-0 text-diff-remove-text" />
            <span className="flex-1 text-xs sm:text-sm leading-relaxed">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Close notice"
              className="bg-transparent border-0 cursor-pointer text-diff-remove-text hover:opacity-75 font-bold p-1 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Open Folder Card */}
          <button
            onClick={handleOpenFolder}
            className="group flex items-start gap-4 p-4 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-accent rounded-xl text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md min-h-[84px]"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FolderOpen size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-semibold text-primary">
                  {t.welcome.openFolder}
                </span>
                <kbd className="text-xs font-mono text-tertiary bg-window px-2 py-0.5 rounded border border-border-subtle shrink-0">
                  Ctrl+O
                </kbd>
              </div>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                {t.welcome.openFolderDesc}
              </p>
            </div>
          </button>

          {/* Clone Repo Card */}
          <button
            type="button"
            data-testid="welcome-clone-btn"
            onClick={() => setIsCloneOpen(true)}
            className="group flex items-start gap-4 p-4 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-accent rounded-xl text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md min-h-[84px]"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <Download size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-semibold text-primary">
                  {t.welcome.cloneRepo}
                </span>
                <kbd className="text-xs font-mono text-tertiary bg-window px-2 py-0.5 rounded border border-border-subtle shrink-0">
                  Ctrl+N
                </kbd>
              </div>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                {t.welcome.cloneRepoDesc}
              </p>
            </div>
          </button>
        </div>

        {/* Drag & Drop Hint */}
        <div
          onClick={handleOpenFolder}
          className="p-3.5 rounded-xl bg-surface/60 border border-dashed border-border-subtle hover:border-accent flex items-center justify-center gap-2.5 text-xs sm:text-sm text-secondary hover:text-primary transition-all cursor-pointer"
        >
          <FolderGit2 size={17} className="text-tertiary" />
          <span>{t.welcome.dropzoneHint}</span>
        </div>

        {/* Recent Repositories Container */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs">
          {/* Section Header with Search Bar */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border-subtle flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-accent" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                {t.welcome.recentTitle}
              </span>
              {recents.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-window text-secondary border border-border-subtle">
                  {filteredRecents.length}/{recents.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search input if recents exist */}
              {recents.length > 0 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.welcome.filterPlaceholder}
                    aria-label={t.welcome.filterAria}
                    className="w-48 sm:w-60 text-xs sm:text-sm pl-8 pr-7 py-1.5 bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary bg-transparent border-0 cursor-pointer p-0.5"
                      title={t.welcome.clearSearch}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}

              {recents.length > 0 && (
                <button
                  type="button"
                  data-testid="clear-recents-btn"
                  onClick={handleClearRecents}
                  className="flex items-center gap-1.5 text-tertiary text-xs sm:text-sm cursor-pointer bg-transparent border border-transparent hover:border-border-subtle px-2.5 py-1 rounded-lg hover:text-diff-remove-text hover:bg-surface-hover transition-colors"
                  title={t.welcome.clearRecentsTooltip}
                >
                  <Trash2 size={13} />
                  <span>{t.welcome.clearRecents}</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="py-8 text-center text-xs sm:text-sm text-tertiary flex items-center justify-center gap-2.5">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>{t.welcome.loading}</span>
            </div>
          ) : recents.length === 0 ? (
            /* Empty state when no recents exist */
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-window border border-border-subtle flex items-center justify-center text-tertiary mb-2.5">
                <FolderOpen size={22} />
              </div>
              <p className="text-sm font-medium text-secondary">
                {t.welcome.emptyRecentsTitle}
              </p>
              <p className="text-xs text-tertiary mt-1">
                {t.welcome.emptyRecentsDesc}
              </p>
            </div>
          ) : filteredRecents.length === 0 ? (
            /* Empty state when search produces no results */
            <div className="py-6 text-center text-xs sm:text-sm text-tertiary">
              {t.welcome.noMatch.replace("{query}", searchQuery)}
            </div>
          ) : (
            /* Filtered recents list */
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredRecents.map((item) => {
                const displayPath = item.path.replace(/^\\\\\?\\/, "");
                return (
                  <div
                    key={item.path}
                    onClick={() => handleOpenRecent(item.path)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-transparent hover:bg-surface-hover transition-colors cursor-pointer gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-window border border-border-subtle flex items-center justify-center text-tertiary group-hover:text-accent group-hover:border-accent transition-colors shrink-0">
                        <GitBranch size={15} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-sm text-primary group-hover:text-accent transition-colors">
                          {item.name}
                        </span>
                        <span
                          className="text-xs font-mono text-tertiary break-all mt-0.5 leading-normal"
                          title={displayPath}
                        >
                          {displayPath}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`remove-recent-${item.path}`}
                        onClick={(e) => handleRemoveRecent(e, item.path)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-0 text-tertiary hover:text-diff-remove-text hover:bg-window transition-all cursor-pointer"
                        title={t.welcome.removeRecentTooltip}
                        aria-label={`${t.welcome.removeRecentTooltip}: ${item.name}`}
                      >
                        <X size={14} />
                      </button>
                      <ArrowRight
                        size={16}
                        className="text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Footer */}
        <footer className="flex items-center justify-center gap-6 text-xs text-tertiary pt-1">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs">
              Ctrl+K
            </kbd>
            <span>{t.welcome.commandPalette}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs">
              ?
            </kbd>
            <span>{t.welcome.shortcuts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs">
              Ctrl+T
            </kbd>
            <span>{t.welcome.gitMode}</span>
          </div>
        </footer>
      </div>

      {/* Clone Modal */}
      <CloneModal
        isOpen={isCloneOpen}
        onClose={() => setIsCloneOpen(false)}
        onCloneSuccess={(summary) => onSelectRepo(summary)}
      />
    </div>
  );
};
