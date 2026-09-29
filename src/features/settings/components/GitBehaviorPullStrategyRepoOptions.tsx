import React from "react";
import { GitMerge, GitPullRequest, Globe } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { GitBehaviorPullStrategyOption } from "./GitBehaviorPullStrategyOption";

export interface GitBehaviorPullStrategyRepoOptionsProps {
  localPullRebase: boolean | null;
  globalPullRebase: boolean;
  loading: boolean;
  saving: boolean;
  onRepoPullStrategyChange: (mode: "inherit" | "merge" | "rebase") => void;
}

/** Repo-scope pull strategy options: inherit from global, force merge, or force rebase. */
export const GitBehaviorPullStrategyRepoOptions: React.FC<GitBehaviorPullStrategyRepoOptionsProps> = ({
  localPullRebase,
  globalPullRebase,
  loading,
  saving,
  onRepoPullStrategyChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <GitBehaviorPullStrategyOption
        selected={localPullRebase === null}
        disabled={loading || saving}
        onClick={() => onRepoPullStrategyChange("inherit")}
        icon={Globe}
      >
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
      </GitBehaviorPullStrategyOption>

      <GitBehaviorPullStrategyOption
        selected={localPullRebase === false}
        disabled={loading || saving}
        onClick={() => onRepoPullStrategyChange("merge")}
        icon={GitMerge}
      >
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
      </GitBehaviorPullStrategyOption>

      <GitBehaviorPullStrategyOption
        selected={localPullRebase === true}
        disabled={loading || saving}
        onClick={() => onRepoPullStrategyChange("rebase")}
        icon={GitPullRequest}
      >
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
      </GitBehaviorPullStrategyOption>
    </div>
  );
};
