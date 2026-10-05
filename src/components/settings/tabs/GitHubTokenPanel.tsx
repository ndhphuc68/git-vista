import React from "react";
import { Key, CheckCircle2, ExternalLink, Eye, EyeOff, Terminal, RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button, Input } from "../../../shared/ui";
import { GitHubTokenStatusAlerts } from "./GitHubTokenStatusAlerts";

export interface GitHubTokenPanelProps {
  token: string;
  onTokenChange: (value: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
  isTesting: boolean;
  onTestAndSave: () => void;
  onUseGhCli: () => void;
  errorMessage: string | null;
  successMessage: string | null;
}

/** Token input, action buttons, and status alerts for connecting a GitHub account. */
export const GitHubTokenPanel: React.FC<GitHubTokenPanelProps> = ({
  token,
  onTokenChange,
  showToken,
  onToggleShowToken,
  isTesting,
  onTestAndSave,
  onUseGhCli,
  errorMessage,
  successMessage,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-primary flex items-center gap-1.5">
          <Key size={14} className="text-accent" />
          <span>{t.settings.github.tokenLabel}</span>
        </label>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=GitVista"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          <span>{t.settings.github.createTokenLink}</span>
          <ExternalLink size={11} />
        </a>
      </div>

      <div className="relative">
        <Input
          size="md"
          mono
          type={showToken ? "text" : "password"}
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder={t.settings.github.tokenPlaceholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleShowToken}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
          title={showToken ? t.settings.github.hideToken : t.settings.github.showToken}
          aria-label={showToken ? t.settings.github.hideToken : t.settings.github.showToken}
        >
          {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <p className="text-xs text-secondary">{t.settings.github.tokenHelp}</p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="primary" onClick={onTestAndSave} disabled={isTesting || !token.trim()}>
          {isTesting ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <CheckCircle2 size={13} />
          )}
          <span>{isTesting ? t.settings.github.testing : t.settings.github.testConnection}</span>
        </Button>

        <Button
          variant="secondary"
          onClick={onUseGhCli}
          disabled={isTesting}
          title={t.settings.github.useGhCliHint}
        >
          <Terminal size={13} />
          <span>{t.settings.github.useGhCli}</span>
        </Button>
      </div>

      <GitHubTokenStatusAlerts errorMessage={errorMessage} successMessage={successMessage} />
    </div>
  );
};
