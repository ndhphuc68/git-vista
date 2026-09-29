import React from "react";
import { Key, CheckCircle2, ExternalLink, Eye, EyeOff, Terminal, RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n";
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
    <div className="space-y-3 bg-surface-header/30 p-4 rounded-xl border border-border-subtle">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Key size={14} className="text-accent" />
          <span>{t.settings.github.tokenLabel}</span>
        </label>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=GitVista"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-accent hover:underline flex items-center gap-1"
        >
          <span>{t.settings.github.createTokenLink}</span>
          <ExternalLink size={11} />
        </a>
      </div>

      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder={t.settings.github.tokenPlaceholder}
          className="w-full text-xs font-mono px-3 py-2 pr-10 rounded-lg bg-surface border border-border-subtle focus:border-accent focus:outline-none text-primary"
        />
        <button
          type="button"
          onClick={onToggleShowToken}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
          title={showToken ? "Ẩn" : "Hiện"}
        >
          {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <p className="text-[11px] text-secondary">{t.settings.github.tokenHelp}</p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onTestAndSave}
          disabled={isTesting || !token.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isTesting ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <CheckCircle2 size={13} />
          )}
          <span>{isTesting ? t.settings.github.testing : t.settings.github.testConnection}</span>
        </button>

        <button
          type="button"
          onClick={onUseGhCli}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors border border-border-subtle cursor-pointer disabled:opacity-50"
          title="Tự động lấy token từ `gh auth token`"
        >
          <Terminal size={13} />
          <span>{t.settings.github.useGhCli}</span>
        </button>
      </div>

      <GitHubTokenStatusAlerts errorMessage={errorMessage} successMessage={successMessage} />
    </div>
  );
};
