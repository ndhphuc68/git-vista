import { useState } from "react";
import type { GitConfigDto } from "../../../ipc/client";

export interface UseGitProfileFormStatusResult {
  globalConfig: GitConfigDto | null;
  setGlobalConfig: (value: GitConfigDto) => void;
  localConfig: GitConfigDto | null;
  setLocalConfig: (value: GitConfigDto) => void;
  isOverride: boolean;
  setIsOverride: (value: boolean) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  saving: boolean;
  setSaving: (value: boolean) => void;
}

/** Loaded-config and loading/saving status for the git profile form. */
export function useGitProfileFormStatus(): UseGitProfileFormStatusResult {
  const [globalConfig, setGlobalConfig] = useState<GitConfigDto | null>(null);
  const [localConfig, setLocalConfig] = useState<GitConfigDto | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  return {
    globalConfig,
    setGlobalConfig,
    localConfig,
    setLocalConfig,
    isOverride,
    setIsOverride,
    loading,
    setLoading,
    saving,
    setSaving,
  };
}
