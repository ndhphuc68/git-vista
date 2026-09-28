import React from "react";
import { GitMerge, GitPullRequest, Check, Globe } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { PullStrategyDiagram } from "../../../components/settings/helpDiagrams";

export interface GitBehaviorPullStrategyProps {
  activeScope: "global" | "repo";
  currentRepoPath: string | null;
  localPullRebase: boolean | null;
  globalPullRebase: boolean;
  loading: boolean;
  saving: boolean;
  onGlobalPullStrategyChange: (isRebase: boolean) => void;
  onRepoPullStrategyChange: (mode: "inherit" | "merge" | "rebase") => void;
}

/** Pull strategy picker: inherit/merge/rebase for repo scope, merge/rebase for global scope. */
export const GitBehaviorPullStrategy: React.FC<GitBehaviorPullStrategyProps> = ({
  activeScope,
  currentRepoPath,
  localPullRebase,
  globalPullRebase,
  loading,
  saving,
  onGlobalPullStrategyChange,
  onRepoPullStrategyChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.behavior.pullRebaseTitle}
        </label>
        <HelpTooltip
          title={t.settings.help.pullStrategyTitle}
          description={t.settings.help.pullStrategyDesc}
          tag={t.settings.help.tagWorkflow}
          diagram={<PullStrategyDiagram />}
        />
      </div>

      {activeScope === "repo" && currentRepoPath ? (
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => onRepoPullStrategyChange("inherit")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              localPullRebase === null
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <Globe
              className={`w-5 h-5 mt-0.5 ${localPullRebase === null ? "text-accent" : "text-secondary"}`}
            />
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

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => onRepoPullStrategyChange("merge")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              localPullRebase === false
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitMerge
              className={`w-5 h-5 mt-0.5 ${localPullRebase === false ? "text-accent" : "text-secondary"}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">
                  {t.settings.behavior.pullMerge}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                  {t.settings.profile.overrideRepoOption}
                </span>
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t.settings.behavior.pullMergeDesc}
              </div>
            </div>
            {localPullRebase === false && <Check size={16} className="text-accent mt-0.5" />}
          </button>

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => onRepoPullStrategyChange("rebase")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              localPullRebase === true
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitPullRequest
              className={`w-5 h-5 mt-0.5 ${localPullRebase === true ? "text-accent" : "text-secondary"}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">
                  {t.settings.behavior.pullRebase}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                  {t.settings.profile.overrideRepoOption}
                </span>
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t.settings.behavior.pullRebaseDesc}
              </div>
            </div>
            {localPullRebase === true && <Check size={16} className="text-accent mt-0.5" />}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => onGlobalPullStrategyChange(false)}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              !globalPullRebase
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitMerge
              className={`w-5 h-5 mt-0.5 ${!globalPullRebase ? "text-accent" : "text-secondary"}`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-primary">
                {t.settings.behavior.pullMerge}
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t.settings.behavior.pullMergeDesc}
              </div>
            </div>
            {!globalPullRebase && <Check size={16} className="text-accent mt-0.5" />}
          </button>

          <button
            type="button"
            disabled={loading || saving}
            onClick={() => onGlobalPullStrategyChange(true)}
            className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              globalPullRebase
                ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
            }`}
          >
            <GitPullRequest
              className={`w-5 h-5 mt-0.5 ${globalPullRebase ? "text-accent" : "text-secondary"}`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-primary">
                {t.settings.behavior.pullRebase}
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t.settings.behavior.pullRebaseDesc}
              </div>
            </div>
            {globalPullRebase && <Check size={16} className="text-accent mt-0.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
