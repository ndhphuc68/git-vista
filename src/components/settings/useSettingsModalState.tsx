import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";
import { useTabStore } from "../../store/useTabStore";
import type { SettingsScopeSelectorProps } from "../../features/settings";
import { buildNavGroups, currentRepoLabel, type NavGroup } from "./settingsModalState.helpers";

export interface UseSettingsModalStateOptions {
  currentRepoPath: string | null;
  isSettingsOpen: boolean;
}

export interface UseSettingsModalStateResult {
  navGroups: NavGroup[];
  scopeSelector: SettingsScopeSelectorProps;
  effectiveScope: "global" | "repo";
  effectiveRepoPath: string | null;
}

/** Owns the global/repo scope state for the settings modal; repo scope always targets the current repo. */
export function useSettingsModalState({
  currentRepoPath,
  isSettingsOpen,
}: UseSettingsModalStateOptions): UseSettingsModalStateResult {
  const { t } = useTranslation();
  const { tabs } = useTabStore();

  const [scope, setScope] = useState<"global" | "repo">(() =>
    currentRepoPath ? "repo" : "global"
  );

  useEffect(() => {
    if (!isSettingsOpen) return;
    setScope(currentRepoPath ? "repo" : "global");
  }, [currentRepoPath, isSettingsOpen]);

  const effectiveScope = currentRepoPath ? scope : "global";
  const effectiveRepoPath = effectiveScope === "repo" ? currentRepoPath : null;

  return {
    navGroups: buildNavGroups(t),
    scopeSelector: {
      hasRepo: Boolean(currentRepoPath),
      scope: effectiveScope,
      onScopeChange: setScope,
      repoLabel: currentRepoPath ? currentRepoLabel(tabs, currentRepoPath) : "",
    },
    effectiveScope,
    effectiveRepoPath,
  };
}
