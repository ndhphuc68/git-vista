import React from "react";
import { User, Palette, Sliders, FileCode, Terminal, GitPullRequest } from "lucide-react";
import { TAB_TYPE } from "../../domain/enums";
import type { Translations } from "../../i18n/vi";
import type { SettingsTab } from "../../store/useSettingsStore";
import type { TabItem } from "../../types/tab";

export interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  id: "git" | "app";
  label: string;
  items: NavItem[];
}

const GIT_CONFIG_TABS: readonly SettingsTab[] = ["profile", "behavior"];

/** True for tabs whose settings can be scoped to a repository. */
export function isGitConfigTab(tab: SettingsTab): boolean {
  return GIT_CONFIG_TABS.includes(tab);
}

/** Sidebar navigation: repo-scopable Git config first, then app-wide settings. */
export function buildNavGroups(t: Translations): NavGroup[] {
  const tabs = t.settings.tabs;
  return [
    {
      id: "git",
      label: t.settings.sidebar.groupGit,
      items: [
        { id: "profile", label: tabs.profile, icon: <User size={16} /> },
        { id: "behavior", label: tabs.behavior, icon: <Sliders size={16} /> },
      ],
    },
    {
      id: "app",
      label: t.settings.sidebar.groupApp,
      items: [
        { id: "appearance", label: tabs.appearance, icon: <Palette size={16} /> },
        { id: "diff", label: tabs.diff, icon: <FileCode size={16} /> },
        { id: "tools", label: tabs.tools, icon: <Terminal size={16} /> },
        { id: "github", label: tabs.github, icon: <GitPullRequest size={16} /> },
      ],
    },
  ];
}

/** Last path segment of a repository path. */
export function repoDisplayName(path: string): string {
  return path.split(/[/\\]/).filter(Boolean).pop() || path;
}

/** Label for the current repo: its tab alias, then repo name, then the last path segment. */
export function currentRepoLabel(tabs: TabItem[], currentRepoPath: string): string {
  const tab = tabs.find((item) => item.type === TAB_TYPE.REPO && item.id === currentRepoPath);
  return tab?.alias || tab?.repo?.name || repoDisplayName(currentRepoPath);
}
