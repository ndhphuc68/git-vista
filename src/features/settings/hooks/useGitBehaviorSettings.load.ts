import { getGitConfig } from "../api";

export interface GitBehaviorLoadContext {
  currentRepoPath: string | null;
  isMounted: () => boolean;
  setGlobalPullRebase: (value: boolean) => void;
  setLocalPullRebase: (value: boolean | null) => void;
  setFetchPrune: (value: boolean) => void;
  setRebaseAutostash: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

/**
 * Loads global git config, then repo-local git config (which overrides the
 * global fetch.prune/rebase.autoStash values when set), guarding every state
 * update behind `isMounted` since this may run past unmount or a repo switch.
 */
export async function loadGitBehaviorSettings(context: GitBehaviorLoadContext): Promise<void> {
  const {
    currentRepoPath,
    isMounted,
    setGlobalPullRebase,
    setLocalPullRebase,
    setFetchPrune,
    setRebaseAutostash,
    setLoading,
  } = context;

  setLoading(true);
  try {
    const globalCfg = await getGitConfig(null);
    if (!isMounted()) return;
    setGlobalPullRebase(Boolean(globalCfg.pullRebase));
    setFetchPrune(Boolean(globalCfg.fetchPrune));
    setRebaseAutostash(Boolean(globalCfg.rebaseAutostash));

    if (currentRepoPath) {
      const localCfg = await getGitConfig(currentRepoPath);
      if (!isMounted()) return;
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
    if (isMounted()) setLoading(false);
  }
}
