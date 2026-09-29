import React, { useEffect, useState } from "react";
import { User, Palette, Sliders, FileCode, Terminal, GitPullRequest } from "lucide-react";
import { useTranslation } from "../../i18n";
import { type SettingsTab } from "../../store/useSettingsStore";
import { useTabStore } from "../../store/useTabStore";
import { type TabItem } from "../../types/tab";

export interface UseSettingsModalStateOptions {
  currentRepoPath: string | null;
  isSettingsOpen: boolean;
}

export interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

export interface UseSettingsModalStateResult {
  scope: "global" | "repo";
  setScope: (scope: "global" | "repo") => void;
  selectedRepoPath: string;
  setSelectedRepoPath: (path: string) => void;
  openRepoTabs: TabItem[];
  activeRepo: TabItem | null | undefined;
  navItems: NavItem[];
  getRepoDisplayName: (path: string) => string;
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

  const openRepoTabs = tabs.filter((tab) => tab.type === "repo" && tab.repo);
  const activeRepo = currentRepoPath ? openRepoTabs.find((tab) => tab.id === currentRepoPath) : null;

  const [scope, setScope] = useState<"global" | "repo">(() => {
    return currentRepoPath ? "repo" : "global";
  });

  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(currentRepoPath || "");

  useEffect(() => {
    if (!isSettingsOpen) return;

    if (currentRepoPath) {
      setSelectedRepoPath(currentRepoPath);
      setScope("repo");
    } else {
      setSelectedRepoPath("");
      setScope("global");
    }
  }, [currentRepoPath, isSettingsOpen]);

  const navItems: NavItem[] = [
    { id: "profile", label: t.settings.tabs.profile, icon: <User size={16} /> },
    { id: "appearance", label: t.settings.tabs.appearance, icon: <Palette size={16} /> },
    { id: "diff", label: t.settings.tabs.diff, icon: <FileCode size={16} /> },
    { id: "behavior", label: t.settings.tabs.behavior, icon: <Sliders size={16} /> },
    { id: "tools", label: t.settings.tabs.tools, icon: <Terminal size={16} /> },
    { id: "github", label: t.settings.tabs.github, icon: <GitPullRequest size={16} /> },
  ];

  const getRepoDisplayName = (path: string) => {
    return path.split(/[/\\]/).filter(Boolean).pop() || path;
  };

  const effectiveScope = currentRepoPath ? scope : "global";
  const effectiveRepoPath = effectiveScope === "repo" ? selectedRepoPath || currentRepoPath : null;

  return {
    scope,
    setScope,
    selectedRepoPath,
    setSelectedRepoPath,
    openRepoTabs,
    activeRepo,
    navItems,
    getRepoDisplayName,
    effectiveScope,
    effectiveRepoPath,
  };
}
