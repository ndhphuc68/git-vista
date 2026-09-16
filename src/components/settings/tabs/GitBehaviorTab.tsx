import React, { useState, useEffect } from "react";
import { GitMerge, GitPullRequest, Clock, Check } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { invokeCommand } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";

interface GitBehaviorTabProps {
  currentRepoPath: string | null;
}

export const GitBehaviorTab: React.FC<GitBehaviorTabProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [pullRebase, setPullRebase] = useState<boolean>(false);
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
        const cfg = await invokeCommand.getGitConfig(currentRepoPath);
        if (isMounted && cfg.pullRebase !== null && cfg.pullRebase !== undefined) {
          setPullRebase(cfg.pullRebase);
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
  }, [currentRepoPath]);

  const handlePullStrategyChange = async (isRebase: boolean) => {
    setPullRebase(isRebase);
    setSaving(true);
    try {
      if (currentRepoPath) {
        await invokeCommand.setRepoPullRebase(currentRepoPath, isRebase);
      } else {
        await invokeCommand.setGitConfig(null, "global", "pull.rebase", String(isRebase));
      }
      addToast({
        title: t.settings.profile.savedSuccess,
        type: "success",
        duration: 2500,
      });
    } catch (err) {
      console.error("Failed to update pull strategy:", err);
      addToast({
        title: t.common.error,
        message: String(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFetchChange = (seconds: number) => {
    setAutoFetchInterval(seconds);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("gitvista_autofetch_interval", String(seconds));
    }
    addToast({
      title: t.settings.profile.savedSuccess,
      type: "success",
      duration: 2500,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">
          {t.settings.behavior.title}
        </h3>
        <p className="text-xs text-secondary">
          {t.settings.behavior.subtitle}
        </p>
      </div>

      {/* Pull Strategy */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.behavior.pullRebaseTitle}
        </label>
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => handlePullStrategyChange(false)}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
              !pullRebase
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitMerge className={`w-5 h-5 mt-0.5 ${!pullRebase ? "text-accent" : "text-secondary"}`} />
            <div className="flex-1">
              <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullMerge}</div>
              <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullMergeDesc}</div>
            </div>
            {!pullRebase && <Check size={16} className="text-accent mt-0.5" />}
          </button>

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => handlePullStrategyChange(true)}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
              pullRebase
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitPullRequest className={`w-5 h-5 mt-0.5 ${pullRebase ? "text-accent" : "text-secondary"}`} />
            <div className="flex-1">
              <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullRebase}</div>
              <div className="text-[11px] text-secondary mt-0.5">{t.settings.behavior.pullRebaseDesc}</div>
            </div>
            {pullRebase && <Check size={16} className="text-accent mt-0.5" />}
          </button>
        </div>
      </div>

      {/* Auto-fetch Interval */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-secondary" />
          <span className="text-xs font-semibold text-primary">
            {t.settings.behavior.autoFetchTitle}
          </span>
        </div>
        <p className="text-[11px] text-secondary">
          {t.settings.behavior.autoFetchDesc}
        </p>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            { value: 0, label: t.settings.behavior.autoFetchOff },
            { value: 300, label: t.settings.behavior.autoFetch5m },
            { value: 900, label: t.settings.behavior.autoFetch15m },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleAutoFetchChange(item.value)}
              className={`py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                autoFetchInterval === item.value
                  ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
