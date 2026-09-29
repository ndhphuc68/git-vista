import React from "react";
import { type SettingsTab } from "../../store/useSettingsStore";
import { GitProfileTab } from "./tabs/GitProfileTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { GitBehaviorTab } from "../../features/settings";
import { DiffViewerTab } from "./tabs/DiffViewerTab";
import { ExternalToolsTab } from "./tabs/ExternalToolsTab";
import { GitHubSettingsTab } from "./tabs/GitHubSettingsTab";

export interface SettingsModalTabContentProps {
  activeTab: SettingsTab;
  effectiveScope: "global" | "repo";
  effectiveRepoPath: string | null;
  setScope: (scope: "global" | "repo") => void;
}

/** Renders the active settings tab's content. */
export const SettingsModalTabContent: React.FC<SettingsModalTabContentProps> = ({
  activeTab,
  effectiveScope,
  effectiveRepoPath,
  setScope,
}) => (
  <div
    key={`${activeTab}-${effectiveScope}-${effectiveRepoPath}`}
    className="animate-fade-in max-w-3xl"
  >
    {activeTab === "profile" && (
      <GitProfileTab
        scope={effectiveScope}
        currentRepoPath={effectiveRepoPath}
        onScopeChange={setScope}
      />
    )}
    {activeTab === "appearance" && <AppearanceTab />}
    {activeTab === "diff" && <DiffViewerTab />}
    {activeTab === "behavior" && (
      <GitBehaviorTab
        scope={effectiveScope}
        currentRepoPath={effectiveRepoPath}
        onScopeChange={setScope}
      />
    )}
    {activeTab === "tools" && <ExternalToolsTab />}
    {activeTab === "github" && <GitHubSettingsTab />}
  </div>
);
