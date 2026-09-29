import { useEffect, useState } from "react";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { AUTOFETCH_INTERVAL_STORAGE_KEY } from "./useGitBehaviorSettings.constants";
import { loadGitBehaviorSettings } from "./useGitBehaviorSettings.load";
import {
  createAutoFetchChangeHandler,
  createGlobalPullStrategyHandler,
  createRepoPullStrategyHandler,
  createToggleFetchPruneHandler,
  createToggleRebaseAutostashHandler,
} from "./useGitBehaviorSettings.actions";

export interface UseGitBehaviorSettingsOptions {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
}

export interface UseGitBehaviorSettingsResult {
  activeScope: "global" | "repo";
  localPullRebase: boolean | null;
  globalPullRebase: boolean;
  fetchPrune: boolean;
  rebaseAutostash: boolean;
  autoFetchInterval: number;
  loading: boolean;
  saving: boolean;
  handleGlobalPullStrategyChange: (isRebase: boolean) => Promise<void>;
  handleRepoPullStrategyChange: (mode: "inherit" | "merge" | "rebase") => Promise<void>;
  handleToggleFetchPrune: () => Promise<void>;
  handleToggleRebaseAutostash: () => Promise<void>;
  handleAutoFetchChange: (seconds: number) => void;
}

/**
 * Loads and saves git behavior settings (pull strategy, fetch.prune,
 * rebase.autoStash, auto-fetch interval) for the given scope, moved intact
 * from the old `GitBehaviorTab` component.
 */
export function useGitBehaviorSettings({
  currentRepoPath,
  scope: propScope,
}: UseGitBehaviorSettingsOptions): UseGitBehaviorSettingsResult {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToastStore();

  const activeScope = propScope || (currentRepoPath ? "repo" : "global");

  const [localPullRebase, setLocalPullRebase] = useState<boolean | null>(null);
  const [globalPullRebase, setGlobalPullRebase] = useState<boolean>(false);
  const [fetchPrune, setFetchPrune] = useState<boolean>(false);
  const [rebaseAutostash, setRebaseAutostash] = useState<boolean>(false);

  const [autoFetchInterval, setAutoFetchInterval] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(AUTOFETCH_INTERVAL_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 300;
    }
    return 300;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void loadGitBehaviorSettings({
      currentRepoPath,
      isMounted: () => isMounted,
      setGlobalPullRebase,
      setLocalPullRebase,
      setFetchPrune,
      setRebaseAutostash,
      setLoading,
    });
    return () => {
      isMounted = false;
    };
  }, [currentRepoPath, activeScope]);

  const actionsContext = {
    currentRepoPath,
    activeScope,
    fetchPrune,
    rebaseAutostash,
    t,
    showSuccess,
    showError,
    setGlobalPullRebase,
    setLocalPullRebase,
    setFetchPrune,
    setRebaseAutostash,
    setSaving,
    setAutoFetchInterval,
  };

  const handleGlobalPullStrategyChange = createGlobalPullStrategyHandler(actionsContext);
  const handleRepoPullStrategyChange = createRepoPullStrategyHandler(actionsContext);
  const handleToggleFetchPrune = createToggleFetchPruneHandler(actionsContext);
  const handleToggleRebaseAutostash = createToggleRebaseAutostashHandler(actionsContext);
  const handleAutoFetchChange = createAutoFetchChangeHandler(actionsContext);

  return {
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
  };
}
