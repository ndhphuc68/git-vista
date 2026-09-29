import { type RepoStatusResult, type RepoHeadInfo } from "../../ipc/bindings.generated";

/** True on macOS/iOS, where header shortcuts are shown with the Cmd modifier. */
export function detectIsMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || "")
  );
}

export interface RepoHeaderShortcutLabels {
  shortcutLabel1: string;
  shortcutLabel2: string;
  shortcutSidebar: string;
}

/** Display labels for the header's keyboard shortcuts, Cmd- or Ctrl-prefixed depending on the platform. */
export function getShortcutLabels(isMac: boolean): RepoHeaderShortcutLabels {
  return {
    shortcutLabel1: isMac ? "Cmd+1" : "Ctrl+1",
    shortcutLabel2: isMac ? "Cmd+2" : "Ctrl+2",
    shortcutSidebar: isMac ? "Cmd+B" : "Ctrl+B",
  };
}

/** Total staged + unstaged + untracked file count shown on the Changes tab badge. */
export function countTotalChanges(repoStatus: RepoStatusResult | undefined): number {
  const stagedCount = repoStatus?.staged?.length ?? 0;
  const unstagedCount = repoStatus?.unstaged?.length ?? 0;
  const untrackedCount = repoStatus?.untracked?.length ?? 0;
  return stagedCount + unstagedCount + untrackedCount;
}

export interface AheadBehindCounts {
  aheadCount: number;
  behindCount: number;
}

/** Ahead/behind commit counts shown on the push/pull badges. */
export function countAheadBehind(headInfo: RepoHeadInfo | undefined): AheadBehindCounts {
  return {
    aheadCount: headInfo?.ahead ?? 0,
    behindCount: headInfo?.behind ?? 0,
  };
}
