import React from "react";
import { useGitBehaviorSettings } from "../hooks/useGitBehaviorSettings";
import { GitBehaviorScopeBanner } from "./GitBehaviorScopeBanner";
import { GitBehaviorOptions } from "./GitBehaviorOptions";

export interface GitBehaviorTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  onScopeChange?: (scope: "global" | "repo") => void;
}

/**
 * Git behavior settings tab: pull strategy, fetch/rebase flags, safety
 * confirmations, and auto-fetch interval. Scope ownership (global vs. repo)
 * still lives in `SettingsModal`, which supplies `scope` and
 * `currentRepoPath`.
 */
export const GitBehaviorTab: React.FC<GitBehaviorTabProps> = ({
  currentRepoPath,
  scope: propScope,
}) => {
  const {
    activeScope,
    localPullRebase,
    globalPullRebase,
    fetchPrune,
    rebaseAutostash,
    autoFetchInterval,
    loading,
    saving,
    handleGlobalPullStrategyChange,
    handleRepoPullStrategyChange,
    handleToggleFetchPrune,
    handleToggleRebaseAutostash,
    handleAutoFetchChange,
  } = useGitBehaviorSettings({ currentRepoPath, scope: propScope });

  const hasLocalOverride =
    activeScope === "repo" && localPullRebase !== null && localPullRebase !== undefined;

  return (
    <div className="space-y-6">
      <GitBehaviorScopeBanner
        activeScope={activeScope}
        currentRepoPath={currentRepoPath}
        hasLocalOverride={hasLocalOverride}
        loading={loading}
        saving={saving}
        onResetToGlobal={() => handleRepoPullStrategyChange("inherit")}
      />

      <GitBehaviorOptions
        activeScope={activeScope}
        currentRepoPath={currentRepoPath}
        localPullRebase={localPullRebase}
        globalPullRebase={globalPullRebase}
        fetchPrune={fetchPrune}
        rebaseAutostash={rebaseAutostash}
        autoFetchInterval={autoFetchInterval}
        loading={loading}
        saving={saving}
        onGlobalPullStrategyChange={handleGlobalPullStrategyChange}
        onRepoPullStrategyChange={handleRepoPullStrategyChange}
        onToggleFetchPrune={handleToggleFetchPrune}
        onToggleRebaseAutostash={handleToggleRebaseAutostash}
        onAutoFetchChange={handleAutoFetchChange}
      />
    </div>
  );
};
