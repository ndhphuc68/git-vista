import React from "react";
import { User, Palette, Sliders, FileCode, Terminal, GitPullRequest } from "lucide-react";
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

export interface RepoChoice {
  path: string;
  label: string;
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

/** Open repo tabs as scope choices; always includes the current repo. */
export function buildRepoChoices(tabs: TabItem[], currentRepoPath: string | null): RepoChoice[] {
  const choices = tabs
    .filter((tab) => tab.type === "repo" && tab.repo)
    .map((tab) => ({
      path: tab.id,
      label: tab.alias || tab.repo?.name || repoDisplayName(tab.id),
    }));
  if (currentRepoPath && !choices.some((choice) => choice.path === currentRepoPath)) {
    choices.unshift({ path: currentRepoPath, label: repoDisplayName(currentRepoPath) });
  }
  return choices;
}
