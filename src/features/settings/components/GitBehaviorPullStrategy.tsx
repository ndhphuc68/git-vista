import React from "react";
import { useTranslation } from "../../../i18n";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { PullStrategyDiagram } from "../../../components/settings/helpDiagrams";
import { GitBehaviorPullStrategyRepoOptions } from "./GitBehaviorPullStrategyRepoOptions";
import { GitBehaviorPullStrategyGlobalOptions } from "./GitBehaviorPullStrategyGlobalOptions";

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
        <GitBehaviorPullStrategyRepoOptions
          localPullRebase={localPullRebase}
          globalPullRebase={globalPullRebase}
          loading={loading}
          saving={saving}
          onRepoPullStrategyChange={onRepoPullStrategyChange}
        />
      ) : (
        <GitBehaviorPullStrategyGlobalOptions
          globalPullRebase={globalPullRebase}
          loading={loading}
          saving={saving}
          onGlobalPullStrategyChange={onGlobalPullStrategyChange}
        />
      )}
    </div>
  );
};
