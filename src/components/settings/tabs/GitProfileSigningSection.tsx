import React from "react";
import { useTranslation } from "../../../i18n";
import { Input, Switch } from "../../../shared/ui";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

export interface GitProfileSigningSectionProps {
  locked: boolean;
  gpgSign: boolean;
  onGpgSignChange: (value: boolean) => void;
  gpgKey: string;
  onGpgKeyChange: (value: string) => void;
}

const GPG_LABEL_ID = "gpg-toggle-label";

/** commit.gpgsign switch and user.signingkey field. */
export const GitProfileSigningSection: React.FC<GitProfileSigningSectionProps> = ({
  locked,
  gpgSign,
  onGpgSignChange,
  gpgKey,
  onGpgKeyChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection
      title={t.settings.sections.signing}
      help={
        <HelpTooltip
          title={t.settings.help.profileGpgTitle}
          description={t.settings.help.profileGpgDesc}
          tag={t.settings.help.tagSafety}
        />
      }
    >
      <SettingsRow
        label={p.gpgEnable}
        labelId={GPG_LABEL_ID}
        description={p.gpgDesc}
        disabled={locked}
      >
        <Switch
          id="gpg-toggle"
          checked={gpgSign}
          onChange={onGpgSignChange}
          disabled={locked}
          aria-labelledby={GPG_LABEL_ID}
          data-testid="toggle-gpg-sign"
        />
      </SettingsRow>
      <SettingsRow label={p.gpgKeyLabel} htmlFor="gpg-key" disabled={locked || !gpgSign}>
        <Input
          id="gpg-key"
          size="md"
          mono
          className="w-72"
          disabled={locked}
          value={gpgKey}
          onChange={(e) => onGpgKeyChange(e.target.value)}
          placeholder={p.gpgKeyPlaceholder}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
