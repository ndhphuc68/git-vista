import React, { useRef, useState } from "react";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { CloneModal } from "./CloneModal";
import { useRecentRepositories } from "../hooks/useRecentRepositories";
import { useWelcomeShortcuts } from "../hooks/useWelcomeShortcuts";
import { useWelcomeDragAndDrop } from "../hooks/useWelcomeDragAndDrop";
import { WelcomeActions } from "./WelcomeActions";
import { RecentRepositoryList } from "./RecentRepositoryList";
import { WelcomeHeader } from "./WelcomeHeader";
import { WelcomeErrorBanner } from "./WelcomeErrorBanner";
import { WelcomeShortcutsFooter } from "./WelcomeShortcutsFooter";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRepo }) => {
  const { openSettings } = useSettingsStore();
  const [isCloneOpen, setIsCloneOpen] = useState(false);
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

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useWelcomeDragAndDrop(openRecent);

  useWelcomeShortcuts({
    openFolder,
    openClone: () => setIsCloneOpen(true),
    focusSearch: () => searchInputRef.current?.focus(),
    clearSearch: () => setSearchQuery(""),
  });

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
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
        <WelcomeHeader onOpenSettings={() => openSettings()} onOpenShortcuts={handleOpenShortcuts} />

        {error && <WelcomeErrorBanner error={error} onDismiss={() => setError(null)} />}

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

        <WelcomeShortcutsFooter />
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
