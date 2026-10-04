import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";
import { useTabStore } from "../../store/useTabStore";
import type { SettingsScopeSelectorProps } from "../../features/settings";
import { buildNavGroups, buildRepoChoices, type NavGroup } from "./settingsModalState.helpers";

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

/** Owns the scope/repo-selection state and derived values for the settings modal. */
export function useSettingsModalState({
  currentRepoPath,
  isSettingsOpen,
}: UseSettingsModalStateOptions): UseSettingsModalStateResult {
  const { t } = useTranslation();
  const { tabs } = useTabStore();

  const [scope, setScope] = useState<"global" | "repo">(() =>
    currentRepoPath ? "repo" : "global"
  );
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(currentRepoPath || "");

  useEffect(() => {
    if (!isSettingsOpen) return;
    setSelectedRepoPath(currentRepoPath || "");
    setScope(currentRepoPath ? "repo" : "global");
  }, [currentRepoPath, isSettingsOpen]);

  const effectiveScope = currentRepoPath ? scope : "global";
  const repoPath = selectedRepoPath || currentRepoPath || "";
  const effectiveRepoPath = effectiveScope === "repo" ? repoPath : null;

  return {
    navGroups: buildNavGroups(t),
    scopeSelector: {
      hasRepo: Boolean(currentRepoPath),
      scope: effectiveScope,
      onScopeChange: setScope,
      repos: buildRepoChoices(tabs, currentRepoPath),
      selectedRepoPath: repoPath,
      onRepoChange: setSelectedRepoPath,
    },
    effectiveScope,
    effectiveRepoPath,
  };
}
