import React from "react";
import { type SettingsTab } from "../../store/useSettingsStore";
import { GitProfileTab } from "./tabs/GitProfileTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { DiffViewerTab } from "./tabs/DiffViewerTab";
import { ExternalToolsTab } from "./tabs/ExternalToolsTab";
import { GitHubSettingsTab } from "./tabs/GitHubSettingsTab";
import {
  GitBehaviorTab,
  SettingsScopeSelector,
  type SettingsScopeSelectorProps,
} from "../../features/settings";
import { type SettingsScope } from "../../domain/enums";

export interface SettingsModalTabContentProps {
  activeTab: SettingsTab;
  effectiveScope: SettingsScope;
  effectiveRepoPath: string | null;
  scopeSelector: SettingsScopeSelectorProps;
}

/** Renders the active settings tab's content. */
export const SettingsModalTabContent: React.FC<SettingsModalTabContentProps> = ({
  activeTab,
  effectiveScope,
  effectiveRepoPath,
  scopeSelector,
}) => {
  const toolbar = <SettingsScopeSelector {...scopeSelector} />;

  return (
    <div key={activeTab} className="mx-auto max-w-3xl animate-fade-in pb-8">
      {activeTab === "profile" && (
        <GitProfileTab
          scope={effectiveScope}
          currentRepoPath={effectiveRepoPath}
          toolbar={toolbar}
        />
      )}
      {activeTab === "behavior" && (
        <GitBehaviorTab
          scope={effectiveScope}
          currentRepoPath={effectiveRepoPath}
          toolbar={toolbar}
        />
      )}
      {activeTab === "appearance" && <AppearanceTab />}
      {activeTab === "diff" && <DiffViewerTab />}
      {activeTab === "tools" && <ExternalToolsTab />}
      {activeTab === "github" && <GitHubSettingsTab />}
    </div>
  );
};
