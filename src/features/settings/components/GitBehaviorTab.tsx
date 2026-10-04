import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsInheritRow, SettingsPage } from "./ui";
import { useGitBehaviorSettings } from "../hooks/useGitBehaviorSettings";
import { GitBehaviorOptions } from "./GitBehaviorOptions";

export interface GitBehaviorTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  /** Scope selector rendered under the page header. */
  toolbar?: React.ReactNode;
}

/**
 * Git behavior settings tab: pull strategy, fetch/rebase flags, safety
 * confirmations, and auto-fetch interval. Scope state lives in
 * `useSettingsModalState`; the scope selector arrives through `toolbar`.
 */
export const GitBehaviorTab: React.FC<GitBehaviorTabProps> = ({
  currentRepoPath,
  scope: propScope,
  toolbar,
}) => {
  const { t } = useTranslation();
  const s = useGitBehaviorSettings({ currentRepoPath, scope: propScope });
  const b = t.settings.behavior;
  const isRepoScope = s.activeScope === "repo" && Boolean(currentRepoPath);
  const inheriting = s.localPullRebase === null || s.localPullRebase === undefined;
  const globalMode = s.globalPullRebase ? "rebase" : "merge";
  const pullRebase = isRepoScope && !inheriting ? Boolean(s.localPullRebase) : s.globalPullRebase;
  const busy = s.loading || s.saving;

  const handlePullStrategyChange = (isRebase: boolean) => {
    if (isRepoScope) s.handleRepoPullStrategyChange(isRebase ? "rebase" : "merge");
    else s.handleGlobalPullStrategyChange(isRebase);
  };

  return (
    <SettingsPage title={b.title} description={b.subtitle} toolbar={toolbar}>
      {isRepoScope && (
        <SettingsInheritRow
          inheriting={inheriting}
          onInheritChange={(inherit) =>
            s.handleRepoPullStrategyChange(inherit ? "inherit" : globalMode)
          }
          description={b.inheritGlobalPullDesc.replace(
            "{strategy}",
            s.globalPullRebase ? b.pullRebaseShort : b.pullMergeShort
          )}
          disabled={busy}
        />
      )}
      <GitBehaviorOptions
        pullRebase={pullRebase}
        pullLocked={isRepoScope && inheriting}
        busy={busy}
        onPullStrategyChange={handlePullStrategyChange}
        fetchPrune={s.fetchPrune}
        onToggleFetchPrune={s.handleToggleFetchPrune}
        autoFetchInterval={s.autoFetchInterval}
        onAutoFetchChange={s.handleAutoFetchChange}
        rebaseAutostash={s.rebaseAutostash}
        onToggleRebaseAutostash={s.handleToggleRebaseAutostash}
      />
    </SettingsPage>
  );
};
