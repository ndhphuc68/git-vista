import React from "react";
import { GitMerge, GitPullRequest } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { GitBehaviorPullStrategyOption } from "./GitBehaviorPullStrategyOption";

export interface GitBehaviorPullStrategyGlobalOptionsProps {
  globalPullRebase: boolean;
  loading: boolean;
  saving: boolean;
  onGlobalPullStrategyChange: (isRebase: boolean) => void;
}

/** Global-scope pull strategy options: merge or rebase. */
export const GitBehaviorPullStrategyGlobalOptions: React.FC<
  GitBehaviorPullStrategyGlobalOptionsProps
> = ({ globalPullRebase, loading, saving, onGlobalPullStrategyChange }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <GitBehaviorPullStrategyOption
        selected={!globalPullRebase}
        disabled={loading || saving}
        onClick={() => onGlobalPullStrategyChange(false)}
        icon={GitMerge}
      >
        <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullMerge}</div>
        <div className="text-[11px] text-secondary mt-0.5">
          {t.settings.behavior.pullMergeDesc}
        </div>
      </GitBehaviorPullStrategyOption>

      <GitBehaviorPullStrategyOption
        selected={globalPullRebase}
        disabled={loading || saving}
        onClick={() => onGlobalPullStrategyChange(true)}
        icon={GitPullRequest}
      >
        <div className="text-xs font-semibold text-primary">{t.settings.behavior.pullRebase}</div>
        <div className="text-[11px] text-secondary mt-0.5">
          {t.settings.behavior.pullRebaseDesc}
        </div>
      </GitBehaviorPullStrategyOption>
    </div>
  );
};
