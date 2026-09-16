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
  Copy,
  Check,
  Star,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";
import { CloneModal } from "./CloneModal";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

/**
 * Định dạng thời gian tương đối thân thiện theo ngôn ngữ hiện tại
 */
function formatRelativeTime(
  timestampMs: number | undefined,
  t: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  }
): string {
  if (!timestampMs || isNaN(timestampMs)) return "";
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestampMs) / 1000));

  if (diffSec < 60) {
    return t.justNow;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return t.minutesAgo.replace("{m}", String(diffMin));
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return t.hoursAgo.replace("{h}", String(diffHour));
  }
  const diffDay = Math.floor(diffHour / 24);
  return t.daysAgo.replace("{d}", String(diffDay));
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRepo,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Lưu trữ các repo được ghim vào localStorage
  const [pinnedPaths, setPinnedPaths] = useState<string[]>(() => {
    try {
      const saved = typeof localStorage !== "undefined" && localStorage.getItem("gitvista_pinned_repos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const handleCopyPath = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(path);
      }
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.warn("Error copying path:", err);
    }
  };

  const togglePin = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setPinnedPaths((prev) => {
      const next = prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path];
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("gitvista_pinned_repos", JSON.stringify(next));
        }
      } catch (err) {
        console.warn("Error saving pinned repos:", err);
      }
      return next;
    });
  };

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
  };

  // Keyboard shortcuts local to WelcomeScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Filter & Sort recents (Pinned repos appear at the top)
  const sortedRecents = useMemo(() => {
    let list = recents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = recents.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const aPinned = pinnedPaths.includes(a.path);
      const bPinned = pinnedPaths.includes(b.path);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return (b.last_opened_at_ms || 0) - (a.last_opened_at_ms || 0);
    });
  }, [recents, searchQuery, pinnedPaths]);

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
      className={`flex flex-col items-center justify-center h-full w-full bg-window overflow-y-auto px-6 py-10 select-none transition-colors duration-200 ${
        isDragging ? "ring-2 ring-accent ring-inset bg-accent-subtle/30" : ""
      }`}
    >
      <div className="w-full max-w-[840px] flex flex-col gap-6 my-auto animate-fade-in">
        {/* Header / Hero Branding */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 animate-slide-down">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle shadow-xs flex items-center justify-center text-accent shrink-0">
              <FolderGit2 size={24} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
                  GitVista
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                  v0.1
                </span>
              </div>
              <p className="text-secondary text-xs sm:text-sm mt-0.5">
                {t.welcome.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleOpenShortcuts}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-xs font-medium text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={t.welcome.shortcuts}
            >
              <kbd className="font-mono text-[10px] bg-window px-1.5 py-0.2 rounded border border-border-subtle">?</kbd>
              <span>{t.welcome.shortcuts}</span>
            </button>
          </div>
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

        {/* Primary Action Cards (2 Thao tác lớn rõ ràng) */}
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Open Folder Card */}
            <button
              onClick={handleOpenFolder}
              className="group flex items-start gap-4 p-4.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-accent rounded-xl text-left card-lift btn-press cursor-pointer shadow-xs hover:shadow-md min-h-[92px]"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                <FolderOpen size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-bold text-primary group-hover:text-accent transition-colors">
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
              className="group flex items-start gap-4 p-4.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-emerald-500 rounded-xl text-left card-lift btn-press cursor-pointer shadow-xs hover:shadow-md min-h-[92px]"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                <Download size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-bold text-primary group-hover:text-emerald-600 transition-colors">
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

          {/* Integrated Drag & Drop Zone */}
          <div
            onClick={handleOpenFolder}
            className="p-3.5 rounded-xl bg-surface/70 border border-dashed border-border-strong/70 hover:border-accent flex items-center justify-center gap-2.5 text-xs sm:text-sm text-secondary hover:text-primary transition-all card-lift btn-press cursor-pointer shadow-2xs hover:bg-surface"
          >
            <FolderGit2 size={16} className="text-tertiary shrink-0" />
            <span>{t.welcome.dropzoneHint}</span>
          </div>
        </div>

        {/* Recent Repositories Container (Tường minh, rõ ràng) */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs animate-slide-up">
          {/* Section Header with Search Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-accent" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                {t.welcome.recentTitle}
              </span>
              {recents.length > 0 && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-window text-secondary border border-border-subtle">
                  {sortedRecents.length}/{recents.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-1 max-w-sm justify-end">
              {/* Search input if recents exist */}
              {recents.length > 0 && (
                <div className="relative w-full max-w-[220px]">
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
                    className="w-full text-xs sm:text-sm pl-8 pr-7 py-1.5 bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent transition-all font-medium"
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
                  className="flex items-center gap-1.5 text-tertiary text-xs sm:text-sm cursor-pointer bg-transparent border border-transparent hover:border-border-subtle px-2.5 py-1 rounded-lg hover:text-diff-remove-text hover:bg-surface-hover transition-colors shrink-0"
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
          ) : sortedRecents.length === 0 ? (
            /* Empty state when search produces no results */
            <div className="py-6 text-center text-xs sm:text-sm text-tertiary">
              {t.welcome.noMatch.replace("{query}", searchQuery)}
            </div>
          ) : (
            /* Filtered & Sorted recents list */
            <div className="flex flex-col gap-1.5 max-h-[290px] overflow-y-auto pr-1">
              {sortedRecents.map((item) => {
                const displayPath = item.path.replace(/^\\\\\?\\/, "");
                const isPinned = pinnedPaths.includes(item.path);
                const relativeTime = formatRelativeTime(item.last_opened_at_ms, t.welcome);

                return (
                  <div
                    key={item.path}
                    onClick={() => handleOpenRecent(item.path)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-transparent hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all cursor-pointer gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-window border border-border-subtle flex items-center justify-center text-secondary group-hover:text-accent group-hover:border-accent transition-colors shrink-0">
                        <GitBranch size={15} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary group-hover:text-accent transition-colors">
                            {item.name}
                          </span>
                          {isPinned && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                              ⭐
                            </span>
                          )}
                        </div>
                        <span
                          className="text-xs font-mono text-tertiary truncate mt-0.5"
                          title={displayPath}
                        >
                          {displayPath}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {relativeTime && (
                        <span className="text-xs text-tertiary hidden sm:inline-block">
                          {relativeTime}
                        </span>
                      )}

                      {/* Quick action buttons on hover */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        {/* Copy Path button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyPath(e, displayPath)}
                          className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent hover:bg-window text-secondary hover:text-primary transition-all cursor-pointer"
                          title={copiedPath === displayPath ? t.welcome.copied : t.welcome.copyPath}
                          aria-label={t.welcome.copyPath}
                        >
                          {copiedPath === displayPath ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        {/* Pin / Unpin button */}
                        <button
                          type="button"
                          onClick={(e) => togglePin(e, item.path)}
                          className={`flex items-center justify-center w-7 h-7 rounded-md bg-transparent hover:bg-window transition-all cursor-pointer ${
                            isPinned ? "text-amber-500" : "text-secondary hover:text-amber-500"
                          }`}
                          title={isPinned ? t.welcome.unpin : t.welcome.pin}
                          aria-label={isPinned ? t.welcome.unpin : t.welcome.pin}
                        >
                          <Star size={14} className={isPinned ? "fill-amber-500 text-amber-500" : ""} />
                        </button>

                        {/* Remove recent button */}
                        <button
                          type="button"
                          data-testid={`remove-recent-${item.path}`}
                          onClick={(e) => handleRemoveRecent(e, item.path)}
                          className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-0 text-secondary hover:text-diff-remove-text hover:bg-window transition-all cursor-pointer"
                          title={t.welcome.removeRecentTooltip}
                          aria-label={`${t.welcome.removeRecentTooltip}: ${item.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>

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
        <footer className="flex items-center justify-center gap-6 text-xs text-tertiary pt-1 border-t border-border-subtle/50">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-secondary">
              Ctrl+K
            </kbd>
            <span>{t.welcome.commandPalette}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-secondary">
              ?
            </kbd>
            <span>{t.welcome.shortcuts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-secondary">
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

