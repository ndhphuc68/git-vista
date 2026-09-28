import { useEffect, useState } from "react";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { getGitConfig, setGitConfig, setRepoPullRebase } from "../api";

const AUTOFETCH_INTERVAL_STORAGE_KEY = "gitvista_autofetch_interval";

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
    const load = async () => {
      setLoading(true);
      try {
        const globalCfg = await getGitConfig(null);
        if (!isMounted) return;
        setGlobalPullRebase(Boolean(globalCfg.pullRebase));
        setFetchPrune(Boolean(globalCfg.fetchPrune));
        setRebaseAutostash(Boolean(globalCfg.rebaseAutostash));

        if (currentRepoPath) {
          const localCfg = await getGitConfig(currentRepoPath);
          if (!isMounted) return;
          setLocalPullRebase(localCfg.pullRebase ?? null);
          if (localCfg.fetchPrune !== undefined && localCfg.fetchPrune !== null) {
            setFetchPrune(Boolean(localCfg.fetchPrune));
          }
          if (localCfg.rebaseAutostash !== undefined && localCfg.rebaseAutostash !== null) {
            setRebaseAutostash(Boolean(localCfg.rebaseAutostash));
          }
        }
      } catch (err) {
        console.error("Failed to load git behavior:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentRepoPath, activeScope]);

  const handleGlobalPullStrategyChange = async (isRebase: boolean) => {
    setGlobalPullRebase(isRebase);
    setSaving(true);
    try {
      await setGitConfig(null, "global", "pull.rebase", String(isRebase));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update global pull strategy:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRepoPullStrategyChange = async (mode: "inherit" | "merge" | "rebase") => {
    if (!currentRepoPath) return;
    setSaving(true);
    try {
      if (mode === "inherit") {
        await setGitConfig(currentRepoPath, "local", "pull.rebase", "");
        setLocalPullRebase(null);
      } else {
        const isRebase = mode === "rebase";
        await setRepoPullRebase(currentRepoPath, isRebase);
        setLocalPullRebase(isRebase);
      }
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update repo pull strategy:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFetchPrune = async () => {
    const nextVal = !fetchPrune;
    setFetchPrune(nextVal);
    setSaving(true);
    try {
      const configScope = activeScope === "repo" && currentRepoPath ? "local" : "global";
      const repo = activeScope === "repo" ? currentRepoPath : null;
      await setGitConfig(repo, configScope, "fetch.prune", String(nextVal));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update fetch.prune:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRebaseAutostash = async () => {
    const nextVal = !rebaseAutostash;
    setRebaseAutostash(nextVal);
    setSaving(true);
    try {
      const configScope = activeScope === "repo" && currentRepoPath ? "local" : "global";
      const repo = activeScope === "repo" ? currentRepoPath : null;
      await setGitConfig(repo, configScope, "rebase.autoStash", String(nextVal));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update rebase.autoStash:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFetchChange = (seconds: number) => {
    setAutoFetchInterval(seconds);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTOFETCH_INTERVAL_STORAGE_KEY, String(seconds));
    }
    showSuccess(t.settings.profile.savedSuccess);
  };

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
