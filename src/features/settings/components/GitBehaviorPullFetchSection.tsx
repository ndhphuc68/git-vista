import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select, Switch } from "../../../shared/ui";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { PullStrategyDiagram, FetchPruneDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "./ui";

export interface GitBehaviorPullFetchSectionProps {
  pullRebase: boolean;
  /** Repo scope while inheriting the global pull strategy. */
  pullLocked: boolean;
  busy: boolean;
  onPullStrategyChange: (isRebase: boolean) => void;
  fetchPrune: boolean;
  onToggleFetchPrune: () => void;
  autoFetchInterval: number;
  onAutoFetchChange: (seconds: number) => void;
}

const PULL_LABEL_ID = "pull-strategy-label";
const PRUNE_LABEL_ID = "fetch-prune-label";

interface AutoFetchRowProps {
  interval: number;
  onChange: (seconds: number) => void;
}

/** Auto-fetch interval row, split out to keep the section function short. */
const AutoFetchRow: React.FC<AutoFetchRowProps> = ({ interval, onChange }) => {
  const { t } = useTranslation();
  const b = t.settings.behavior;
  const h = t.settings.help;

  return (
    <SettingsRow
      label={b.autoFetchTitle}
      description={b.autoFetchDesc}
      help={
        <HelpTooltip
          title={h.autoFetchTitle}
          description={h.autoFetchDesc}
          tag={h.tagRecommended}
        />
      }
    >
      <Select
        data-testid="auto-fetch-select"
        aria-label={b.autoFetchTitle}
        value={String(interval)}
        onChange={(value) => onChange(Number(value))}
        options={[
          { value: "0", label: b.autoFetchOff },
          { value: "300", label: b.autoFetch5m },
          { value: "900", label: b.autoFetch15m },
        ]}
        className="w-44"
      />
    </SettingsRow>
  );
};

/** Pull strategy, fetch.prune and background auto-fetch. */
export const GitBehaviorPullFetchSection: React.FC<GitBehaviorPullFetchSectionProps> = ({
  pullRebase,
  pullLocked,
  busy,
  onPullStrategyChange,
  fetchPrune,
  onToggleFetchPrune,
  autoFetchInterval,
  onAutoFetchChange,
}) => {
  const { t } = useTranslation();
  const b = t.settings.behavior;
  const h = t.settings.help;

  return (
    <SettingsSection title={t.settings.sections.pullFetch}>
      <SettingsRow
        label={b.pullRebaseTitle}
        labelId={PULL_LABEL_ID}
        description={pullRebase ? b.pullRebaseDesc : b.pullMergeDesc}
        help={
          <HelpTooltip
            title={h.pullStrategyTitle}
            description={h.pullStrategyDesc}
            tag={h.tagWorkflow}
            diagram={<PullStrategyDiagram />}
          />
        }
      >
        <SegmentedControl
          aria-labelledby={PULL_LABEL_ID}
          value={pullRebase ? "rebase" : "merge"}
          onChange={(mode) => onPullStrategyChange(mode === "rebase")}
          disabled={busy || pullLocked}
          options={[
            { value: "merge", label: b.pullMergeShort, testId: "pull-strategy-merge" },
            { value: "rebase", label: b.pullRebaseShort, testId: "pull-strategy-rebase" },
          ]}
        />
      </SettingsRow>
      <SettingsRow
        label={b.fetchPruneTitle}
        labelId={PRUNE_LABEL_ID}
        description={b.fetchPruneDesc}
        help={
          <HelpTooltip
            title={h.fetchPruneTitle}
            description={h.fetchPruneDesc}
            tag={h.tagRecommended}
            diagram={<FetchPruneDiagram />}
          />
        }
      >
        <Switch
          checked={fetchPrune}
          onChange={onToggleFetchPrune}
          aria-labelledby={PRUNE_LABEL_ID}
          data-testid="toggle-fetch-prune"
        />
      </SettingsRow>
      <AutoFetchRow interval={autoFetchInterval} onChange={onAutoFetchChange} />
    </SettingsSection>
  );
};
