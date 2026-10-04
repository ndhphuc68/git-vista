import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { AutostashDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../components/settings/ui";

export interface GitBehaviorRebaseSectionProps {
  rebaseAutostash: boolean;
  onToggleRebaseAutostash: () => void;
}

const LABEL_ID = "rebase-autostash-label";

/** rebase.autoStash switch. */
export const GitBehaviorRebaseSection: React.FC<GitBehaviorRebaseSectionProps> = ({
  rebaseAutostash,
  onToggleRebaseAutostash,
}) => {
  const { t } = useTranslation();
  const h = t.settings.help;

  return (
    <SettingsSection title={t.settings.sections.rebase}>
      <SettingsRow
        label={t.settings.behavior.rebaseAutostashTitle}
        labelId={LABEL_ID}
        description={t.settings.behavior.rebaseAutostashDesc}
        help={
          <HelpTooltip
            title={h.rebaseAutostashTitle}
            description={h.rebaseAutostashDesc}
            tag={h.tagRecommended}
            diagram={<AutostashDiagram />}
          />
        }
      >
        <Switch
          checked={rebaseAutostash}
          onChange={onToggleRebaseAutostash}
          aria-labelledby={LABEL_ID}
          data-testid="toggle-rebase-autostash"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
