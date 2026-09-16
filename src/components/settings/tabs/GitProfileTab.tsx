import React, { useState, useEffect } from "react";
import { Globe, FolderGit2, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand, ConfigScope, GitConfigDto } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";

interface GitProfileTabProps {
  currentRepoPath: string | null;
}

export const GitProfileTab: React.FC<GitProfileTabProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToastStore();

  const [scope, setScope] = useState<ConfigScope>(currentRepoPath ? "local" : "global");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");

  const [globalConfig, setGlobalConfig] = useState<GitConfigDto | null>(null);
  const [localConfig, setLocalConfig] = useState<GitConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load configs
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const globalCfg = await invokeCommand.getGitConfig(null);
        if (!isMounted) return;
        setGlobalConfig(globalCfg);

        let localCfg: GitConfigDto | null = null;
        if (currentRepoPath) {
          localCfg = await invokeCommand.getGitConfig(currentRepoPath);
          if (!isMounted) return;
          setLocalConfig(localCfg);
        }

        const activeCfg = (scope === "local" && localCfg) ? localCfg : globalCfg;
        setUserName(activeCfg.userName || "");
        setUserEmail(activeCfg.userEmail || "");
        setDefaultBranch(activeCfg.defaultBranch || "main");
      } catch (err) {
        console.error("Failed to load git config:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentRepoPath, scope]);

  const handleScopeChange = (newScope: ConfigScope) => {
    if (newScope === "local" && !currentRepoPath) return;
    setScope(newScope);
    const cfg = (newScope === "local" && localConfig) ? localConfig : globalConfig;
    if (cfg) {
      setUserName(cfg.userName || "");
      setUserEmail(cfg.userEmail || "");
      setDefaultBranch(cfg.defaultBranch || "main");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const repoPath = scope === "local" ? currentRepoPath : null;
      await invokeCommand.setGitConfig(repoPath, scope, "user.name", userName.trim());
      await invokeCommand.setGitConfig(repoPath, scope, "user.email", userEmail.trim());
      await invokeCommand.setGitConfig(repoPath, scope, "init.defaultBranch", defaultBranch.trim() || "main");

      showSuccess(t.settings.profile.savedSuccess);

      // Reload config
      const updatedGlobal = await invokeCommand.getGitConfig(null);
      setGlobalConfig(updatedGlobal);
      if (currentRepoPath) {
        const updatedLocal = await invokeCommand.getGitConfig(currentRepoPath);
        setLocalConfig(updatedLocal);
      }
    } catch (err) {
      console.error("Failed to save git config:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const isInherited =
    scope === "local" &&
    localConfig?.userNameSource === "global" &&
    Boolean(localConfig?.userName);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">
          {t.settings.profile.title}
        </h3>
        <p className="text-xs text-secondary">
          {t.settings.profile.subtitle}
        </p>
      </div>

      {/* Scope Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary">
          {t.settings.profile.scopeLabel}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleScopeChange("global")}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              scope === "global"
                ? "border-accent bg-accent/10 text-primary"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <Globe className={`w-5 h-5 mt-0.5 ${scope === "global" ? "text-accent" : "text-secondary"}`} />
            <div>
              <div className="text-xs font-semibold text-primary">{t.settings.profile.scopeGlobal}</div>
              <div className="text-[11px] text-secondary mt-0.5">{t.settings.profile.scopeGlobalDesc}</div>
            </div>
          </button>

          <button
            type="button"
            disabled={!currentRepoPath}
            onClick={() => handleScopeChange("local")}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              !currentRepoPath
                ? "opacity-40 cursor-not-allowed border-border-subtle bg-surface-header/20 text-muted"
                : scope === "local"
                ? "border-accent bg-accent/10 text-primary"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <FolderGit2 className={`w-5 h-5 mt-0.5 ${scope === "local" ? "text-accent" : "text-secondary"}`} />
            <div>
              <div className="text-xs font-semibold text-primary">{t.settings.profile.scopeLocal}</div>
              <div className="text-[11px] text-secondary mt-0.5">{t.settings.profile.scopeLocalDesc}</div>
            </div>
          </button>
        </div>

        {!currentRepoPath && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-500 mt-1">
            <AlertCircle size={13} />
            <span>{t.settings.profile.noRepoWarning}</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="user-name" className="text-xs font-medium text-primary">
              {t.settings.profile.userNameLabel}
            </label>
            {isInherited && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-secondary border border-border-subtle">
                {t.settings.profile.inheritedFromGlobal}
              </span>
            )}
          </div>
          <input
            id="user-name"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t.settings.profile.userNamePlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="user-email" className="text-xs font-medium text-primary block mb-1.5">
            {t.settings.profile.userEmailLabel}
          </label>
          <input
            id="user-email"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder={t.settings.profile.userEmailPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="default-branch" className="text-xs font-medium text-primary block mb-1.5">
            {t.settings.profile.defaultBranchLabel}
          </label>
          <input
            id="default-branch"
            type="text"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder={t.settings.profile.defaultBranchPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-accent-fg hover:opacity-90 active:scale-95 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} />
            <span>{saving ? t.common.loading : t.settings.profile.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
