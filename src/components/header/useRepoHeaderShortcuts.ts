import { SCREEN_TYPE } from "../../domain/enums";
import { useEffect } from "react";
import { type RepoSummary } from "../../ipc/bindings.generated";
import { type ActiveScreen } from "../../store/useViewStore";

/**
 * Cmd/Ctrl+1 (history), Cmd/Ctrl+2 (changes), Cmd/Ctrl+3 (pull-requests) and Cmd/Ctrl+B (toggle sidebar)
 * keyboard shortcuts for the repo header, active only while a repo is open.
 */
export function useRepoHeaderShortcuts(
  currentRepo: RepoSummary | null,
  setActiveScreen: (screen: ActiveScreen) => void,
  toggleSidebar: () => void,
  isGitHub?: boolean
) {
  useEffect(() => {
    if (!currentRepo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        setActiveScreen(SCREEN_TYPE.HISTORY);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        setActiveScreen(SCREEN_TYPE.CHANGES);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "3" && isGitHub) {
        e.preventDefault();
        setActiveScreen(SCREEN_TYPE.PULL_REQUESTS);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentRepo, setActiveScreen, toggleSidebar, isGitHub]);
}
