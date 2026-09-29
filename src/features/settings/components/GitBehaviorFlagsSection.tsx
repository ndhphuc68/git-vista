import React from "react";
import { Scissors, Archive } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { FetchPruneDiagram, AutostashDiagram } from "../../../components/settings/helpDiagrams";
import { GitBehaviorToggleSwitch } from "./GitBehaviorToggleSwitch";

export interface GitBehaviorFlagsSectionProps {
  fetchPrune: boolean;
  rebaseAutostash: boolean;
  onToggleFetchPrune: () => void;
  onToggleRebaseAutostash: () => void;
}

/** Git flags: fetch.prune and rebase.autoStash toggles. */
export const GitBehaviorFlagsSection: React.FC<GitBehaviorFlagsSectionProps> = ({
  fetchPrune,
  rebaseAutostash,
  onToggleFetchPrune,
  onToggleRebaseAutostash,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
        <div className="flex items-start gap-2.5">
          <Scissors size={16} className="text-accent mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary block">
                {t.settings.behavior.fetchPruneTitle}
              </span>
              <HelpTooltip
                title={t.settings.help.fetchPruneTitle}
                description={t.settings.help.fetchPruneDesc}
                tag={t.settings.help.tagRecommended}
                diagram={<FetchPruneDiagram />}
              />
            </div>
            <span className="text-[11px] text-secondary block mt-0.5">
              {t.settings.behavior.fetchPruneDesc}
            </span>
          </div>
        </div>
        <GitBehaviorToggleSwitch
          checked={fetchPrune}
          testId="toggle-fetch-prune"
          ariaLabel={t.settings.behavior.fetchPruneTitle}
          onClick={onToggleFetchPrune}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
        <div className="flex items-start gap-2.5">
          <Archive size={16} className="text-accent mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary block">
                {t.settings.behavior.rebaseAutostashTitle}
              </span>
              <HelpTooltip
                title={t.settings.help.rebaseAutostashTitle}
                description={t.settings.help.rebaseAutostashDesc}
                tag={t.settings.help.tagRecommended}
                diagram={<AutostashDiagram />}
              />
            </div>
            <span className="text-[11px] text-secondary block mt-0.5">
              {t.settings.behavior.rebaseAutostashDesc}
            </span>
          </div>
        </div>
        <GitBehaviorToggleSwitch
          checked={rebaseAutostash}
          testId="toggle-rebase-autostash"
          ariaLabel={t.settings.behavior.rebaseAutostashTitle}
          onClick={onToggleRebaseAutostash}
        />
      </div>
    </div>
  );
};
