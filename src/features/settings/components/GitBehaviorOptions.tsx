import React from "react";
import { Clock, ShieldAlert, Scissors, Archive } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { FetchPruneDiagram, AutostashDiagram, ConfirmationsDiagram } from "../../../components/settings/helpDiagrams";
import { GitBehaviorPullStrategy } from "./GitBehaviorPullStrategy";
import { GitBehaviorToggleSwitch } from "./GitBehaviorToggleSwitch";

export interface GitBehaviorOptionsProps {
  activeScope: "global" | "repo";
  currentRepoPath: string | null;
  localPullRebase: boolean | null;
  globalPullRebase: boolean;
  fetchPrune: boolean;
  rebaseAutostash: boolean;
  autoFetchInterval: number;
  loading: boolean;
  saving: boolean;
  onGlobalPullStrategyChange: (isRebase: boolean) => void;
  onRepoPullStrategyChange: (mode: "inherit" | "merge" | "rebase") => void;
  onToggleFetchPrune: () => void;
  onToggleRebaseAutostash: () => void;
  onAutoFetchChange: (seconds: number) => void;
}

/**
 * Pull strategy, fetch/rebase flags, safety confirmations, and auto-fetch
 * interval controls for the git behavior settings tab.
 */
export const GitBehaviorOptions: React.FC<GitBehaviorOptionsProps> = ({
  activeScope,
  currentRepoPath,
  localPullRebase,
  globalPullRebase,
  fetchPrune,
  rebaseAutostash,
  autoFetchInterval,
  loading,
  saving,
  onGlobalPullStrategyChange,
  onRepoPullStrategyChange,
  onToggleFetchPrune,
  onToggleRebaseAutostash,
  onAutoFetchChange,
}) => {
  const { t } = useTranslation();
  const {
    confirmDiscard,
    confirmDeleteBranch,
    confirmForcePush,
    setConfirmDiscard,
    setConfirmDeleteBranch,
    setConfirmForcePush,
  } = useSettingsStore();

  return (
    <>
      <GitBehaviorPullStrategy
        activeScope={activeScope}
        currentRepoPath={currentRepoPath}
        localPullRebase={localPullRebase}
        globalPullRebase={globalPullRebase}
        loading={loading}
        saving={saving}
        onGlobalPullStrategyChange={onGlobalPullStrategyChange}
        onRepoPullStrategyChange={onRepoPullStrategyChange}
      />

      {/* Git Flags: fetch.prune & rebase.autoStash */}
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

      {/* Safety Confirmations */}
      <div className="pt-3 border-t border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-accent" />
          <span className="text-xs font-semibold text-primary block">
            {t.settings.behavior.confirmationsTitle}
          </span>
          <HelpTooltip
            title={t.settings.help.confirmationsTitle}
            description={t.settings.help.confirmationsDesc}
            tag={t.settings.help.tagSafety}
            diagram={<ConfirmationsDiagram />}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmDiscardLabel}
            </span>
            <GitBehaviorToggleSwitch
              checked={confirmDiscard}
              testId="toggle-confirm-discard"
              ariaLabel={t.settings.behavior.confirmDiscardLabel}
              onClick={() => setConfirmDiscard(!confirmDiscard)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmDeleteBranchLabel}
            </span>
            <GitBehaviorToggleSwitch
              checked={confirmDeleteBranch}
              testId="toggle-confirm-delete-branch"
              ariaLabel={t.settings.behavior.confirmDeleteBranchLabel}
              onClick={() => setConfirmDeleteBranch(!confirmDeleteBranch)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
            <span className="text-xs font-medium text-primary">
              {t.settings.behavior.confirmForcePushLabel}
            </span>
            <GitBehaviorToggleSwitch
              checked={confirmForcePush}
              testId="toggle-confirm-force-push"
              ariaLabel={t.settings.behavior.confirmForcePushLabel}
              onClick={() => setConfirmForcePush(!confirmForcePush)}
            />
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
          <HelpTooltip
            title={t.settings.help.autoFetchTitle}
            description={t.settings.help.autoFetchDesc}
            tag={t.settings.help.tagRecommended}
          />
        </div>
        <p className="text-[11px] text-secondary">{t.settings.behavior.autoFetchDesc}</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { value: 0, label: t.settings.behavior.autoFetchOff },
            { value: 300, label: t.settings.behavior.autoFetch5m },
            { value: 900, label: t.settings.behavior.autoFetch15m },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAutoFetchChange(opt.value)}
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
    </>
  );
};
