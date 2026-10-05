import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select } from "../../../shared/ui";
import {
  useSettingsStore,
  type AvatarStyle,
  type DateFormat,
  type Locale,
} from "../../../store/useSettingsStore";
import { SettingsRow, SettingsSection } from "../../../features/settings";

const LOCALE_LABEL_ID = "appearance-locale-label";

/** Display language, date format and author avatar style. */
export const AppearanceDisplaySection: React.FC = () => {
  const { t } = useTranslation();
  const a = t.settings.appearance;
  const { locale, setLocale, dateFormat, setDateFormat, avatarStyle, setAvatarStyle } =
    useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.display}>
      <SettingsRow label={a.localeTitle} labelId={LOCALE_LABEL_ID}>
        <SegmentedControl<Locale>
          aria-labelledby={LOCALE_LABEL_ID}
          value={locale}
          onChange={setLocale}
          options={[
            { value: "vi", label: a.localeVi, testId: "locale-vi" },
            { value: "en", label: a.localeEn, testId: "locale-en" },
          ]}
        />
      </SettingsRow>
      <SettingsRow label={a.dateFormatTitle}>
        <Select
          data-testid="date-format-select"
          aria-label={a.dateFormatTitle}
          value={dateFormat}
          onChange={(value) => setDateFormat(value as DateFormat)}
          options={[
            { value: "relative", label: a.dateRelative },
            { value: "absolute", label: a.dateAbsolute },
          ]}
          className="w-72"
        />
      </SettingsRow>
      <SettingsRow label={a.avatarTitle}>
        <Select
          data-testid="avatar-style-select"
          aria-label={a.avatarTitle}
          value={avatarStyle}
          onChange={(value) => setAvatarStyle(value as AvatarStyle)}
          options={[
            { value: "initials", label: a.avatarInitials },
            { value: "gravatar", label: a.avatarGravatar },
            { value: "none", label: a.avatarNone },
          ]}
          className="w-72"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
