import React, { useState, useEffect } from "react";
import { GitMerge, GitPullRequest, Clock, Check, FolderGit2, Globe, ShieldAlert, Scissors, Archive } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";
import { useSettingsStore } from "../../../store/useSettingsStore";

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
  const {
    confirmDiscard,
    confirmDeleteBranch,
    confirmForcePush,
    setConfirmDiscard,
    setConfirmDeleteBranch,
    setConfirmForcePush,
  } = useSettingsStore();

  const activeScope = propScope || (currentRepoPath ? "repo" : "global");

  const [localPullRebase, setLocalPullRebase] = useState<boolean | null>(null);
  const [globalPullRebase, setGlobalPullRebase] = useState<boolean>(false);
  const [fetchPrune, setFetchPrune] = useState<boolean>(false);
  const [rebaseAutostash, setRebaseAutostash] = useState<boolean>(false);

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
        setFetchPrune(Boolean(globalCfg.fetchPrune));
        setRebaseAutostash(Boolean(globalCfg.rebaseAutostash));

        if (currentRepoPath) {
          const localCfg = await invokeCommand.getGitConfig(currentRepoPath);
          if (!isMounted) return;
          setLocalPullRebase(localCfg.pullRebase ?? null);
          if (localCfg.fetchPrune !== undefined && localCfg.fetchPrune !== null) {
            setFetchPrune(Boolean(localCfg.fetchPrune));
          }
          if (localCfg.rebaseAutostash !== undefined && localCfg.rebaseAutostash !== null) {
            setRebaseAutostash(Boolean(localCfg.rebaseAutostash));
          }
        }
      } catch (err) {
        console.error("Failed to load git behavior:", err);
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

  const handleToggleFetchPrune = async () => {
    const nextVal = !fetchPrune;
    setFetchPrune(nextVal);
    setSaving(true);
    try {
      const scope = activeScope === "repo" && currentRepoPath ? "local" : "global";
      const repo = activeScope === "repo" ? currentRepoPath : null;
      await invokeCommand.setGitConfig(repo, scope, "fetch.prune", String(nextVal));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update fetch.prune:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRebaseAutostash = async () => {
    const nextVal = !rebaseAutostash;
    setRebaseAutostash(nextVal);
    setSaving(true);
    try {
      const scope = activeScope === "repo" && currentRepoPath ? "local" : "global";
      const repo = activeScope === "repo" ? currentRepoPath : null;
      await invokeCommand.setGitConfig(repo, scope, "rebase.autoStash", String(nextVal));
      showSuccess(t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update rebase.autoStash:", err);
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
                <span className="font-mono text-accent">{currentRepoPath.split(/[/\\]/).filter(Boolean).pop() || currentRepoPath}</span>
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

      {/* Git Flags: fetch.prune & rebase.autoStash */}
      <div className="pt-3 border-t border-border-subtle space-y-3">
        {/* Fetch Prune */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <div className="flex items-start gap-2.5">
            <Scissors size={16} className="text-accent mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-primary block">
                {t.settings.behavior.fetchPruneTitle}
              </span>
              <span className="text-[11px] text-secondary block mt-0.5">
                {t.settings.behavior.fetchPruneDesc}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={fetchPrune}
            data-testid="toggle-fetch-prune"
            onClick={handleToggleFetchPrune}
            aria-label={t.settings.behavior.fetchPruneTitle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
              fetchPrune ? "bg-accent" : "bg-border-strong"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                fetchPrune ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Rebase AutoStash */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <div className="flex items-start gap-2.5">
            <Archive size={16} className="text-accent mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-primary block">
                {t.settings.behavior.rebaseAutostashTitle}
              </span>
              <span className="text-[11px] text-secondary block mt-0.5">
                {t.settings.behavior.rebaseAutostashDesc}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={rebaseAutostash}
            data-testid="toggle-rebase-autostash"
            onClick={handleToggleRebaseAutostash}
            aria-label={t.settings.behavior.rebaseAutostashTitle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
              rebaseAutostash ? "bg-accent" : "bg-border-strong"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                rebaseAutostash ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Safety Confirmations */}
      <div className="pt-3 border-t border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-accent" />
          <span className="text-xs font-semibold text-primary block">
            {t.settings.behavior.confirmationsTitle}
          </span>
        </div>

        <div className="space-y-2">
          {/* Confirm Discard */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmDiscardLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={confirmDiscard}
              data-testid="toggle-confirm-discard"
              onClick={() => setConfirmDiscard(!confirmDiscard)}
              aria-label={t.settings.behavior.confirmDiscardLabel}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
                confirmDiscard ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  confirmDiscard ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Confirm Delete Branch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmDeleteBranchLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={confirmDeleteBranch}
              data-testid="toggle-confirm-delete-branch"
              onClick={() => setConfirmDeleteBranch(!confirmDeleteBranch)}
              aria-label={t.settings.behavior.confirmDeleteBranchLabel}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
                confirmDeleteBranch ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  confirmDeleteBranch ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Confirm Force Push */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmForcePushLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={confirmForcePush}
              data-testid="toggle-confirm-force-push"
              onClick={() => setConfirmForcePush(!confirmForcePush)}
              aria-label={t.settings.behavior.confirmForcePushLabel}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
                confirmForcePush ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  confirmForcePush ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
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
