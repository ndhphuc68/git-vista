import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { WhitespaceDiagram } from "../helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../features/settings";

/** Ignore-whitespace and line-number switches. */
export const DiffOptionsSection: React.FC = () => {
  const { t } = useTranslation();
  const d = t.settings.diff;
  const h = t.settings.help;
  const s = useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.options}>
      <SettingsRow
        label={d.whitespaceTitle}
        labelId="diff-whitespace-label"
        description={d.whitespaceIgnoreDesc}
        help={
          <HelpTooltip
            title={h.diffWhitespaceTitle}
            description={h.diffWhitespaceDesc}
            tag={h.tagRecommended}
            diagram={<WhitespaceDiagram />}
          />
        }
      >
        <Switch
          checked={s.diffIgnoreWhitespace}
          onChange={s.setDiffIgnoreWhitespace}
          aria-labelledby="diff-whitespace-label"
          data-testid="toggle-diff-ignore-whitespace"
        />
      </SettingsRow>
      <SettingsRow
        label={d.lineNumbersTitle}
        labelId="diff-line-numbers-label"
        description={d.lineNumbersDesc}
      >
        <Switch
          checked={s.diffShowLineNumbers}
          onChange={s.setDiffShowLineNumbers}
          aria-labelledby="diff-line-numbers-label"
          data-testid="toggle-diff-show-line-numbers"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
