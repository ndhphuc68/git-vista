import React, { useRef, useState } from "react";
import { AlertCircle, Settings } from "lucide-react";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { CloneModal } from "../../../components/welcome/CloneModal";
import { useRecentRepositories } from "../hooks/useRecentRepositories";
import { useWelcomeShortcuts } from "../hooks/useWelcomeShortcuts";
import { WelcomeActions } from "./WelcomeActions";
import { RecentRepositoryList } from "./RecentRepositoryList";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRepo }) => {
  const { t } = useTranslation();
  const { openSettings } = useSettingsStore();
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    error,
    setError,
    searchQuery,
    setSearchQuery,
    copiedPath,
    pinnedPaths,
    recents,
    sortedRecents,
    isLoading,
    openFolder,
    openRecent,
    clearRecents,
    removeRecent,
    copyPath,
    togglePin,
  } = useRecentRepositories(onSelectRepo);

  useWelcomeShortcuts({
    openFolder,
    openClone: () => setIsCloneOpen(true),
    focusSearch: () => searchInputRef.current?.focus(),
    clearSearch: () => setSearchQuery(""),
  });

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
  };

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
          openRecent(droppedPath);
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
            <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1">
              <img
                src="/app-icon.png"
                alt="GitVista Logo"
                className="w-full h-full object-contain select-none pointer-events-none"
              />
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
              <p className="text-secondary text-xs sm:text-sm mt-0.5">{t.welcome.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => openSettings()}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-xs font-medium text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`${t.settings.title} (Ctrl+,)`}
            >
              <Settings size={13} className="text-secondary" />
              <span>{t.settings.title}</span>
            </button>
            <button
              onClick={handleOpenShortcuts}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-xs font-medium text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={t.welcome.shortcuts}
            >
              <kbd className="font-mono text-[10px] bg-window px-1.5 py-0.2 rounded border border-border-subtle">
                ?
              </kbd>
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

        <WelcomeActions onOpenFolder={openFolder} onOpenClone={() => setIsCloneOpen(true)} />

        <RecentRepositoryList
          recents={recents}
          sortedRecents={sortedRecents}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputRef={searchInputRef}
          pinnedPaths={pinnedPaths}
          copiedPath={copiedPath}
          onOpenRecent={openRecent}
          onClearRecents={clearRecents}
          onRemoveRecent={removeRecent}
          onCopyPath={copyPath}
          onTogglePin={togglePin}
        />

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
