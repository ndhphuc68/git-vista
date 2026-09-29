import { useEffect } from "react";
import type { GitConfigDto } from "../../../ipc/client";
import { createLoadConfigHandler } from "./useGitProfileForm.load";

export interface UseGitProfileFormLoadEffectOptions {
  currentRepoPath: string | null;
  activeScope: "global" | "repo";
  setGlobalConfig: (value: GitConfigDto) => void;
  setLocalConfig: (value: GitConfigDto) => void;
  setIsOverride: (value: boolean) => void;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setDefaultBranch: (value: string) => void;
  setGpgSign: (value: boolean) => void;
  setGpgKey: (value: string) => void;
  setLoading: (value: boolean) => void;
}

/** Runs the git config load on mount and whenever the repo path or scope changes. */
export function useGitProfileFormLoadEffect(options: UseGitProfileFormLoadEffectOptions) {
  const {
    currentRepoPath,
    activeScope,
    setGlobalConfig,
    setLocalConfig,
    setIsOverride,
    setUserName,
    setUserEmail,
    setDefaultBranch,
    setGpgSign,
    setGpgKey,
    setLoading,
  } = options;

  useEffect(() => {
    let isMounted = true;
    const load = createLoadConfigHandler({
      currentRepoPath,
      activeScope,
      isMounted: () => isMounted,
      setGlobalConfig,
      setLocalConfig,
      setIsOverride,
      setUserName,
      setUserEmail,
      setDefaultBranch,
      setGpgSign,
      setGpgKey,
      setLoading,
    });

    load();
    return () => {
      isMounted = false;
    };
  }, [
    currentRepoPath,
    activeScope,
    setGlobalConfig,
    setLocalConfig,
    setIsOverride,
    setUserName,
    setUserEmail,
    setDefaultBranch,
    setGpgSign,
    setGpgKey,
    setLoading,
  ]);
}
