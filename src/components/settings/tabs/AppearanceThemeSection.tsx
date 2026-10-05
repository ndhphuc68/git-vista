import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Switch } from "../../../shared/ui";
import { useSettingsStore, type Theme } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../../../features/settings";

const THEME_LABEL_ID = "appearance-theme-label";
const COLORBLIND_LABEL_ID = "appearance-colorblind-label";

/** Color theme and colorblind mode. */
export const AppearanceThemeSection: React.FC = () => {
  const { t } = useTranslation();
  const a = t.settings.appearance;
  const { theme, setTheme, colorblind, setColorblind } = useSettingsStore();
  const themeOptions: { value: Theme; label: string; testId: string }[] = [
    { value: "light", label: a.themeLight, testId: "theme-light" },
    { value: "dark", label: a.themeDark, testId: "theme-dark" },
    { value: "system", label: a.themeSystem, testId: "theme-system" },
  ];

  return (
    <SettingsSection title={t.settings.sections.theme}>
      <SettingsRow
        label={a.themeTitle}
        labelId={THEME_LABEL_ID}
        help={
          <HelpTooltip
            title={t.settings.help.appearanceThemeTitle}
            description={t.settings.help.appearanceThemeDesc}
            tag={t.settings.help.tagVisual}
          />
        }
      >
        <SegmentedControl
          aria-labelledby={THEME_LABEL_ID}
          value={theme}
          onChange={setTheme}
          options={themeOptions}
        />
      </SettingsRow>
      <SettingsRow
        label={a.colorblindTitle}
        labelId={COLORBLIND_LABEL_ID}
        description={a.colorblindDesc}
      >
        <Switch
          checked={colorblind}
          onChange={setColorblind}
          aria-labelledby={COLORBLIND_LABEL_ID}
          data-testid="toggle-colorblind"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
