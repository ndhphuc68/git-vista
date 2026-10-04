import React from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Input, type InputProps } from "../../../shared/ui";
import { SettingsRow, SettingsSection } from "../../../features/settings";

export interface GitProfileIdentitySectionProps {
  showDefaultBranch: boolean;
  locked: boolean;
  userName: string;
  onUserNameChange: (value: string) => void;
  userEmail: string;
  onUserEmailChange: (value: string) => void;
  defaultBranch: string;
  onDefaultBranchChange: (value: string) => void;
}

const ProfileInput: React.FC<InputProps & { locked: boolean }> = ({ locked, ...rest }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      {locked && (
        <Lock
          size={13}
          role="img"
          aria-label={t.settings.scope.lockedHint}
          className="text-tertiary"
        />
      )}
      <Input size="md" mono disabled={locked} className="w-72" {...rest} />
    </div>
  );
};

/** user.name, user.email and (global scope only) init.defaultBranch. */
export const GitProfileIdentitySection: React.FC<GitProfileIdentitySectionProps> = ({
  showDefaultBranch,
  locked,
  userName,
  onUserNameChange,
  userEmail,
  onUserEmailChange,
  defaultBranch,
  onDefaultBranchChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection title={t.settings.sections.identity}>
      <SettingsRow label={p.userNameLabel} htmlFor="user-name" disabled={locked}>
        <ProfileInput
          id="user-name"
          locked={locked}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder={p.userNamePlaceholder}
        />
      </SettingsRow>
      <SettingsRow label={p.userEmailLabel} htmlFor="user-email" disabled={locked}>
        <ProfileInput
          id="user-email"
          type="email"
          locked={locked}
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          placeholder={p.userEmailPlaceholder}
        />
      </SettingsRow>
      {showDefaultBranch && (
        <SettingsRow label={p.defaultBranchLabel} htmlFor="default-branch">
          <ProfileInput
            id="default-branch"
            locked={false}
            value={defaultBranch}
            onChange={(e) => onDefaultBranchChange(e.target.value)}
            placeholder={p.defaultBranchPlaceholder}
          />
        </SettingsRow>
      )}
    </SettingsSection>
  );
};
