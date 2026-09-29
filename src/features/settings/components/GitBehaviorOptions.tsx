import React from "react";
import { GitBehaviorPullStrategy } from "./GitBehaviorPullStrategy";
import { GitBehaviorFlagsSection } from "./GitBehaviorFlagsSection";
import { GitBehaviorConfirmationsSection } from "./GitBehaviorConfirmationsSection";
import { GitBehaviorAutoFetchSection } from "./GitBehaviorAutoFetchSection";

export interface GitBehaviorOptionsProps {
  activeScope: "global" | "repo";
  currentRepoPath: string | null;
  localPullRebase: boolean | null;
  globalPullRebase: boolean;
  fetchPrune: boolean;
  rebaseAutostash: boolean;
  autoFetchInterval: number;
  loading: boolean;
  saving: boolean;
  onGlobalPullStrategyChange: (isRebase: boolean) => void;
  onRepoPullStrategyChange: (mode: "inherit" | "merge" | "rebase") => void;
  onToggleFetchPrune: () => void;
  onToggleRebaseAutostash: () => void;
  onAutoFetchChange: (seconds: number) => void;
}

/**
 * Pull strategy, fetch/rebase flags, safety confirmations, and auto-fetch
 * interval controls for the git behavior settings tab.
 */
export const GitBehaviorOptions: React.FC<GitBehaviorOptionsProps> = ({
  activeScope,
  currentRepoPath,
  localPullRebase,
  globalPullRebase,
  fetchPrune,
  rebaseAutostash,
  autoFetchInterval,
  loading,
  saving,
  onGlobalPullStrategyChange,
  onRepoPullStrategyChange,
  onToggleFetchPrune,
  onToggleRebaseAutostash,
  onAutoFetchChange,
}) => (
  <>
    <GitBehaviorPullStrategy
      activeScope={activeScope}
      currentRepoPath={currentRepoPath}
      localPullRebase={localPullRebase}
      globalPullRebase={globalPullRebase}
      loading={loading}
      saving={saving}
      onGlobalPullStrategyChange={onGlobalPullStrategyChange}
      onRepoPullStrategyChange={onRepoPullStrategyChange}
    />

    <GitBehaviorFlagsSection
      fetchPrune={fetchPrune}
      rebaseAutostash={rebaseAutostash}
      onToggleFetchPrune={onToggleFetchPrune}
      onToggleRebaseAutostash={onToggleRebaseAutostash}
    />

    <GitBehaviorConfirmationsSection />

    <GitBehaviorAutoFetchSection
      autoFetchInterval={autoFetchInterval}
      onAutoFetchChange={onAutoFetchChange}
    />
  </>
);
