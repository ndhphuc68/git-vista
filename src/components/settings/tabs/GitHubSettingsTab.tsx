import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useGitHubSettings } from "./useGitHubSettings";
import { GitHubAccountCard } from "./GitHubAccountCard";
import { GitHubTokenPanel } from "./GitHubTokenPanel";

export const GitHubSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    token,
    setToken,
    showToken,
    setShowToken,
    isLoading,
    isTesting,
    connectedUser,
    errorMessage,
    successMessage,
    handleTestAndSave,
    handleUseGhCli,
    handleDisconnect,
  } = useGitHubSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-secondary text-xs">
        <RefreshCw size={16} className="animate-spin mr-2" />
        <span>Đang tải cấu hình GitHub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">{t.settings.github.title}</h3>
        <p className="text-xs text-secondary">{t.settings.github.description}</p>
      </div>

      {connectedUser && (
        <GitHubAccountCard connectedUser={connectedUser} onDisconnect={handleDisconnect} />
      )}

      <GitHubTokenPanel
        token={token}
        onTokenChange={setToken}
        showToken={showToken}
        onToggleShowToken={() => setShowToken(!showToken)}
        isTesting={isTesting}
        onTestAndSave={handleTestAndSave}
        onUseGhCli={handleUseGhCli}
        errorMessage={errorMessage}
        successMessage={successMessage}
      />
    </div>
  );
};
