import React, { useState, useEffect } from "react";
import { Globe, FolderGit2, Check, ShieldCheck, Key, FileText } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand, type GitConfigDto } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";
import { useSettingsStore, type CommitMessageLimit } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

interface GitProfileTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  onScopeChange?: (scope: "global" | "repo") => void;
}

export const GitProfileTab: React.FC<GitProfileTabProps> = ({
  currentRepoPath,
  scope: propScope,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToastStore();
  const { commitMessageLimit, setCommitMessageLimit } = useSettingsStore();

  const activeScope = propScope || (currentRepoPath ? "repo" : "global");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [gpgSign, setGpgSign] = useState(false);
  const [gpgKey, setGpgKey] = useState("");

  const [globalConfig, setGlobalConfig] = useState<GitConfigDto | null>(null);
  const [localConfig, setLocalConfig] = useState<GitConfigDto | null>(null);
  const [isOverride, setIsOverride] = useState(false);
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

        if (activeScope === "repo" && localCfg) {
          const hasLocalOverride = localCfg.userNameSource === "local";
          setIsOverride(hasLocalOverride);
          setUserName(localCfg.userName || globalCfg.userName || "");
          setUserEmail(localCfg.userEmail || globalCfg.userEmail || "");
          setGpgSign(localCfg.gpgSign ?? globalCfg.gpgSign ?? false);
          setGpgKey(localCfg.gpgKey ?? globalCfg.gpgKey ?? "");
        } else {
          setIsOverride(false);
          setUserName(globalCfg.userName || "");
          setUserEmail(globalCfg.userEmail || "");
          setDefaultBranch(globalCfg.defaultBranch || "main");
          setGpgSign(Boolean(globalCfg.gpgSign));
          setGpgKey(globalCfg.gpgKey || "");
        }
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
  }, [currentRepoPath, activeScope]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeScope === "repo" && currentRepoPath) {
        if (isOverride) {
          await invokeCommand.setGitConfig(currentRepoPath, "local", "user.name", userName.trim());
          await invokeCommand.setGitConfig(
            currentRepoPath,
            "local",
            "user.email",
            userEmail.trim()
          );
          await invokeCommand.setGitConfig(
            currentRepoPath,
            "local",
            "commit.gpgsign",
            String(gpgSign)
          );
          await invokeCommand.setGitConfig(
            currentRepoPath,
            "local",
            "user.signingkey",
            gpgKey.trim()
          );
        } else {
          // Clear local override to inherit
          await invokeCommand.setGitConfig(currentRepoPath, "local", "user.name", "");
          await invokeCommand.setGitConfig(currentRepoPath, "local", "user.email", "");
          await invokeCommand.setGitConfig(currentRepoPath, "local", "commit.gpgsign", "");
          await invokeCommand.setGitConfig(currentRepoPath, "local", "user.signingkey", "");
        }
      } else {
        await invokeCommand.setGitConfig(null, "global", "user.name", userName.trim());
        await invokeCommand.setGitConfig(null, "global", "user.email", userEmail.trim());
        await invokeCommand.setGitConfig(
          null,
          "global",
          "init.defaultBranch",
          defaultBranch.trim() || "main"
        );
        await invokeCommand.setGitConfig(null, "global", "commit.gpgsign", String(gpgSign));
        await invokeCommand.setGitConfig(null, "global", "user.signingkey", gpgKey.trim());
      }

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

  const handleResetToGlobal = async () => {
    if (!currentRepoPath) return;
    setSaving(true);
    try {
      await invokeCommand.setGitConfig(currentRepoPath, "local", "user.name", "");
      await invokeCommand.setGitConfig(currentRepoPath, "local", "user.email", "");
      await invokeCommand.setGitConfig(currentRepoPath, "local", "commit.gpgsign", "");
      await invokeCommand.setGitConfig(currentRepoPath, "local", "user.signingkey", "");

      const updatedLocal = await invokeCommand.getGitConfig(currentRepoPath);
      setLocalConfig(updatedLocal);
      setIsOverride(false);
      if (globalConfig) {
        setUserName(globalConfig.userName || "");
        setUserEmail(globalConfig.userEmail || "");
        setGpgSign(Boolean(globalConfig.gpgSign));
        setGpgKey(globalConfig.gpgKey || "");
      }
      showSuccess(t.settings.profile.resetSuccess);
    } catch (err) {
      console.error("Failed to reset git config:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const hasLocalOverride =
    activeScope === "repo" &&
    Boolean(localConfig?.userNameSource === "local" && localConfig?.userName);

  const commitLimitOptions: { value: CommitMessageLimit; label: string }[] = [
    { value: 0, label: t.settings.profile.commitLengthNoLimit },
    { value: 50, label: t.settings.profile.commitLength50 },
    { value: 72, label: t.settings.profile.commitLength72 },
  ];

  return (
    <div className="space-y-6">
      {/* Scope Header Banner */}
      {activeScope === "repo" && currentRepoPath ? (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FolderGit2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-primary">
                {t.settings.profile.repoSettingsBanner}{" "}
                <span className="font-mono text-accent">
                  {currentRepoPath.split(/[/\\]/).filter(Boolean).pop() || currentRepoPath}
                </span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                {t.settings.profile.repoSettingsDesc}
              </p>
            </div>
          </div>
          {hasLocalOverride && (
            <button
              type="button"
              data-testid="reset-to-global-btn"
              onClick={handleResetToGlobal}
              disabled={saving || loading}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle text-secondary hover:text-primary text-[11px] font-medium transition-colors cursor-pointer"
            >
              {t.settings.profile.resetToGlobalBtn}
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-header/40 border border-border-subtle flex items-start gap-3">
          <Globe className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary">
              {t.settings.profile.scopeGlobal}
            </div>
            <p className="text-[11px] text-secondary mt-0.5">
              {t.settings.profile.scopeGlobalDesc}
            </p>
          </div>
        </div>
      )}

      {/* Inherit vs Override Toggle (When in Repo Scope) */}
      {activeScope === "repo" && currentRepoPath && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-secondary block">
              {t.settings.profile.scopeLabel}
            </label>
            <HelpTooltip
              title={t.settings.help.profileScopeTitle}
              description={t.settings.help.profileScopeDesc}
              tag={t.settings.help.tagWorkflow}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                !isOverride
                  ? "border-accent bg-accent/10 text-primary"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <input
                type="radio"
                name="repo-profile-inherit-mode"
                data-testid="inherit-toggle-inherit"
                checked={!isOverride}
                onChange={() => {
                  setIsOverride(false);
                  if (globalConfig) {
                    setUserName(globalConfig.userName || "");
                    setUserEmail(globalConfig.userEmail || "");
                    setGpgSign(Boolean(globalConfig.gpgSign));
                    setGpgKey(globalConfig.gpgKey || "");
                  }
                }}
                className="accent-accent"
              />
              <div className="text-xs font-medium">
                <div>{t.settings.profile.inheritGlobalOption}</div>
                <div className="text-[11px] text-secondary mt-0.5">
                  {globalConfig?.userName
                    ? `(${globalConfig.userName} <${globalConfig.userEmail}>)`
                    : ""}
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isOverride
                  ? "border-accent bg-accent/10 text-primary"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <input
                type="radio"
                name="repo-profile-inherit-mode"
                data-testid="inherit-toggle-override"
                checked={isOverride}
                onChange={() => setIsOverride(true)}
                className="accent-accent"
              />
              <div className="text-xs font-medium">
                <div>{t.settings.profile.overrideRepoOption}</div>
                <div className="text-[11px] text-secondary mt-0.5">
                  {t.settings.profile.scopeLocalDesc}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="user-name" className="text-xs font-medium text-primary">
              {t.settings.profile.userNameLabel}
            </label>
            {activeScope === "repo" && !isOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
                {t.settings.profile.inheritedFromGlobal}
              </span>
            )}
            {activeScope === "repo" && isOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                {t.settings.profile.overrideRepoOption}
              </span>
            )}
          </div>
          <input
            id="user-name"
            type="text"
            disabled={activeScope === "repo" && !isOverride}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t.settings.profile.userNamePlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="user-email" className="text-xs font-medium text-primary">
              {t.settings.profile.userEmailLabel}
            </label>
            {activeScope === "repo" && !isOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
                {t.settings.profile.inheritedFromGlobal}
              </span>
            )}
            {activeScope === "repo" && isOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                {t.settings.profile.overrideRepoOption}
              </span>
            )}
          </div>
          <input
            id="user-email"
            type="email"
            disabled={activeScope === "repo" && !isOverride}
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder={t.settings.profile.userEmailPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
        </div>

        {activeScope === "global" && (
          <div>
            <label
              htmlFor="default-branch"
              className="text-xs font-medium text-primary block mb-1.5"
            >
              {t.settings.profile.defaultBranchLabel}
            </label>
            <input
              id="default-branch"
              type="text"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder={t.settings.profile.defaultBranchPlaceholder}
              className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors font-mono"
            />
          </div>
        )}

        {/* GPG Signing Section */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="text-accent mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-semibold text-primary">
                  {t.settings.profile.gpgTitle}
                </div>
                <HelpTooltip
                  title={t.settings.help.profileGpgTitle}
                  description={t.settings.help.profileGpgDesc}
                  tag={t.settings.help.tagSafety}
                />
              </div>
              <p className="text-[11px] text-secondary mt-0.5">{t.settings.profile.gpgDesc}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <label htmlFor="gpg-toggle" className="text-xs font-medium text-primary cursor-pointer">
              {t.settings.profile.gpgEnable}
            </label>
            <button
              id="gpg-toggle"
              type="button"
              role="switch"
              disabled={activeScope === "repo" && !isOverride}
              aria-checked={gpgSign}
              data-testid="toggle-gpg-sign"
              onClick={() => setGpgSign(!gpgSign)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                gpgSign ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  gpgSign ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Key size={13} className="text-secondary" />
              <label htmlFor="gpg-key" className="text-xs font-medium text-primary">
                {t.settings.profile.gpgKeyLabel}
              </label>
            </div>
            <input
              id="gpg-key"
              type="text"
              disabled={activeScope === "repo" && !isOverride}
              value={gpgKey}
              onChange={(e) => setGpgKey(e.target.value)}
              placeholder={t.settings.profile.gpgKeyPlaceholder}
              className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Commit Conventions Section */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-accent mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-primary">
                {t.settings.profile.commitConventionsTitle}
              </div>
              <label className="text-[11px] text-secondary mt-0.5 block">
                {t.settings.profile.commitLengthLabel}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {commitLimitOptions.map((opt) => {
              const isSelected = commitMessageLimit === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`commit-limit-${opt.value}`}
                  onClick={() => setCommitMessageLimit(opt.value)}
                  className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                    isSelected
                      ? "border-accent bg-accent/10 text-primary ring-1 ring-accent font-semibold"
                      : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            data-testid="save-profile-btn"
            disabled={saving || loading || (activeScope === "repo" && !isOverride)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white hover:opacity-90 active:scale-95 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} />
            <span>{saving ? t.common.loading : t.settings.profile.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
