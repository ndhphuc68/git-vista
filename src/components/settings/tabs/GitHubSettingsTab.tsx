import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Unlink,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand } from "../../../ipc/client";
import { testGitHubToken } from "../../../services/githubService";
import { type GitHubUserSummary } from "../../../ipc/bindings";

export const GitHubSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [connectedUser, setConnectedUser] = useState<GitHubUserSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadToken = async () => {
      try {
        const existing = await invokeCommand.getGitHubToken();
        if (!mounted) return;
        if (existing) {
          setToken(existing);
          try {
            const user = await testGitHubToken(existing);
            if (mounted) setConnectedUser(user);
          } catch {
            // Token might be invalid or expired
          }
        }
      } catch (err) {
        console.error("Error loading GitHub token:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadToken();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTestAndSave = async () => {
    if (!token.trim()) {
      setErrorMessage(t.settings.github.noToken);
      return;
    }
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await testGitHubToken(token.trim());
      await invokeCommand.saveGitHubToken(token.trim());
      setConnectedUser(user);
      setSuccessMessage(t.settings.github.connectionSuccess);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể xác thực token với GitHub.");
      setConnectedUser(null);
    } finally {
      setIsTesting(false);
    }
  };

  const handleUseGhCli = async () => {
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const cliToken = await invokeCommand.getGitHubToken();
      if (!cliToken) {
        setErrorMessage("Không tìm thấy phiên đăng nhập GitHub CLI (gh auth token).");
        return;
      }
      setToken(cliToken);
      const user = await testGitHubToken(cliToken);
      await invokeCommand.saveGitHubToken(cliToken);
      setConnectedUser(user);
      setSuccessMessage(t.settings.github.connectionSuccess);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể lấy token từ GitHub CLI.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await invokeCommand.removeGitHubToken();
      setToken("");
      setConnectedUser(null);
      setSuccessMessage(t.settings.github.tokenRemoved);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi gỡ bỏ token.");
    }
  };

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

      {/* Account Card if Connected */}
      {connectedUser && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectedUser.avatar_url ? (
              <img
                src={connectedUser.avatar_url}
                alt={connectedUser.login}
                className="w-10 h-10 rounded-full border border-emerald-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-600">
                {connectedUser.login.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs text-secondary flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>{t.settings.github.connectedAs}</span>
              </div>
              <a
                href={connectedUser.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                @{connectedUser.login}
                <ExternalLink size={12} className="text-secondary" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Unlink size={13} />
            <span>{t.settings.github.disconnect}</span>
          </button>
        </div>
      )}

      {/* Token Input Section */}
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
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.settings.github.tokenPlaceholder}
            className="w-full text-xs font-mono px-3 py-2 pr-10 rounded-lg bg-surface border border-border-subtle focus:border-accent focus:outline-none text-primary"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
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
            onClick={handleTestAndSave}
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
            onClick={handleUseGhCli}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors border border-border-subtle cursor-pointer disabled:opacity-50"
            title="Tự động lấy token từ `gh auth token`"
          >
            <Terminal size={13} />
            <span>{t.settings.github.useGhCli}</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center gap-2 mt-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs flex items-center gap-2 mt-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
