import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { SettingsPage, SettingsSection } from "../../../features/settings";
import { useGitHubSettings } from "./useGitHubSettings";
import { GitHubAccountCard } from "./GitHubAccountCard";
import { GitHubTokenPanel } from "./GitHubTokenPanel";

export const GitHubSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const gh = useGitHubSettings();

  if (gh.isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-secondary">
        <RefreshCw size={16} className="mr-2 animate-spin" />
        <span>{t.settings.github.loading}</span>
      </div>
    );
  }

  return (
    <SettingsPage title={t.settings.github.title} description={t.settings.github.description}>
      {gh.connectedUser && (
        <GitHubAccountCard connectedUser={gh.connectedUser} onDisconnect={gh.handleDisconnect} />
      )}
      <SettingsSection title={t.settings.sections.auth}>
        <GitHubTokenPanel
          token={gh.token}
          onTokenChange={gh.setToken}
          showToken={gh.showToken}
          onToggleShowToken={() => gh.setShowToken(!gh.showToken)}
          isTesting={gh.isTesting}
          onTestAndSave={gh.handleTestAndSave}
          onUseGhCli={gh.handleUseGhCli}
          errorMessage={gh.errorMessage}
          successMessage={gh.successMessage}
        />
      </SettingsSection>
    </SettingsPage>
  );
};
