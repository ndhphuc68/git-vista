import React, { useState, useEffect } from "react";
import { GitMerge, GitPullRequest, Clock, Check, FolderGit2, Globe } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";

interface GitBehaviorTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  onScopeChange?: (scope: "global" | "repo") => void;
}

export const GitBehaviorTab: React.FC<GitBehaviorTabProps> = ({
  currentRepoPath,
  scope: propScope,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToastStore();

  const activeScope = propScope || (currentRepoPath ? "repo" : "global");

  const [localPullRebase, setLocalPullRebase] = useState<boolean | null>(null);
  const [globalPullRebase, setGlobalPullRebase] = useState<boolean>(false);
  const [autoFetchInterval, setAutoFetchInterval] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("gitvista_autofetch_interval");
      return saved ? parseInt(saved, 10) : 300;
    }
    return 300;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const globalCfg = await invokeCommand.getGitConfig(null);
        if (!isMounted) return;
        setGlobalPullRebase(Boolean(globalCfg.pullRebase));

        if (currentRepoPath) {
          const localCfg = await invokeCommand.getGitConfig(currentRepoPath);
          if (!isMounted) return;
          setLocalPullRebase(localCfg.pullRebase ?? null);
        }
      } catch (err) {
        console.error("Failed to load pull strategy:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentRepoPath, activeScope]);

  const handleGlobalPullStrategyChange = async (isRebase: boolean) => {
    setGlobalPullRebase(isRebase);
    setSaving(true);
    try {
      await invokeCommand.setGitConfig(null, "global", "pull.rebase", String(isRebase));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update global pull strategy:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRepoPullStrategyChange = async (mode: "inherit" | "merge" | "rebase") => {
    if (!currentRepoPath) return;
    setSaving(true);
    try {
      if (mode === "inherit") {
        await invokeCommand.setGitConfig(currentRepoPath, "local", "pull.rebase", "");
        setLocalPullRebase(null);
      } else {
        const isRebase = mode === "rebase";
        await invokeCommand.setRepoPullRebase(currentRepoPath, isRebase);
        setLocalPullRebase(isRebase);
      }
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update repo pull strategy:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFetchChange = (seconds: number) => {
    setAutoFetchInterval(seconds);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("gitvista_autofetch_interval", String(seconds));
    }
    showSuccess(t.settings.profile.savedSuccess);
  };

  const hasLocalOverride =
    activeScope === "repo" && localPullRebase !== null && localPullRebase !== undefined;

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
                <span className="font-mono text-accent">{currentRepoPath.split("/").pop()}</span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                {t.settings.profile.repoSettingsDesc}
              </p>
            </div>
          </div>
          {hasLocalOverride && (
            <button
              type="button"
              data-testid="reset-pull-to-global-btn"
              onClick={() => handleRepoPullStrategyChange("inherit")}
              disabled={saving || loading}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle text-secondary hover:text-primary text-[11px] font-medium transition-colors cursor-pointer"
            >
              {t.settings.behavior.resetToGlobalBtn}
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

      {/* Pull Strategy */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.behavior.pullRebaseTitle}
        </label>

        {activeScope === "repo" && currentRepoPath ? (
          /* Repo Scope Options: Inherit vs Merge vs Rebase */
          <div className="space-y-3">
            {/* Inherit from Global */}
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleRepoPullStrategyChange("inherit")}
              className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                localPullRebase === null
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <Globe className={`w-5 h-5 mt-0.5 ${localPullRebase === null ? "text-accent" : "text-secondary"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {t.settings.behavior.inheritGlobalPull}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
                    {globalPullRebase ? "Rebase" : "Merge"}
                  </span>
                </div>
                <div className="text-[11px] text-secondary mt-0.5">
                  {t.settings.behavior.inheritGlobalPullDesc.replace(
                    "{strategy}",
                    globalPullRebase ? "Rebase" : "Merge"
                  )}
                </div>
              </div>
              {localPullRebase === null && <Check size={16} className="text-accent mt-0.5" />}
            </button>

            {/* Merge Commit Override */}
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleRepoPullStrategyChange("merge")}
              className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                localPullRebase === false
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <GitMerge className={`w-5 h-5 mt-0.5 ${localPullRebase === false ? "text-accent" : "text-secondary"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">{t.settings.behavior.pullMerge}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                    {t.settings.profile.overrideRepoOption}
                  </span>
                </div>
                <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullMergeDesc}</div>
              </div>
              {localPullRebase === false && <Check size={16} className="text-accent mt-0.5" />}
            </button>

            {/* Rebase Override */}
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleRepoPullStrategyChange("rebase")}
              className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                localPullRebase === true
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <GitPullRequest className={`w-5 h-5 mt-0.5 ${localPullRebase === true ? "text-accent" : "text-secondary"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">{t.settings.behavior.pullRebase}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                    {t.settings.profile.overrideRepoOption}
                  </span>
                </div>
                <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullRebaseDesc}</div>
              </div>
              {localPullRebase === true && <Check size={16} className="text-accent mt-0.5" />}
            </button>
          </div>
        ) : (
          /* Global Scope Options: Merge vs Rebase */
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleGlobalPullStrategyChange(false)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                !globalPullRebase
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <GitMerge className={`w-5 h-5 mt-0.5 ${!globalPullRebase ? "text-accent" : "text-secondary"}`} />
              <div className="flex-1">
                <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullMerge}</div>
                <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullMergeDesc}</div>
              </div>
              {!globalPullRebase && <Check size={16} className="text-accent mt-0.5" />}
            </button>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleGlobalPullStrategyChange(true)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                globalPullRebase
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <GitPullRequest className={`w-5 h-5 mt-0.5 ${globalPullRebase ? "text-accent" : "text-secondary"}`} />
              <div className="flex-1">
                <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullRebase}</div>
                <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullRebaseDesc}</div>
              </div>
              {globalPullRebase && <Check size={16} className="text-accent mt-0.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Auto Fetch (Global App Behavior) */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          <label className="text-xs font-medium text-primary">
            {t.settings.behavior.autoFetchTitle}
          </label>
        </div>
        <p className="text-[11px] text-secondary">
          {t.settings.behavior.autoFetchDesc}
        </p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { value: 0, label: t.settings.behavior.autoFetchOff },
            { value: 300, label: t.settings.behavior.autoFetch5m },
            { value: 900, label: t.settings.behavior.autoFetch15m },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAutoFetchChange(opt.value)}
              className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                autoFetchInterval === opt.value
                  ? "border-accent bg-accent text-white font-semibold shadow-xs"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
