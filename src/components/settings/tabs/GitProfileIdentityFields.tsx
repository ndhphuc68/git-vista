import React from "react";
import { useTranslation } from "../../../i18n";
import { Input } from "../../../shared/ui";
import { GitProfileScopeBadge } from "./GitProfileScopeBadge";

export interface GitProfileIdentityFieldsProps {
  activeScope: "global" | "repo";
  isOverride: boolean;
  userName: string;
  onUserNameChange: (value: string) => void;
  userEmail: string;
  onUserEmailChange: (value: string) => void;
  defaultBranch: string;
  onDefaultBranchChange: (value: string) => void;
}

/** user.name, user.email, and (global scope only) init.defaultBranch fields. */
export const GitProfileIdentityFields: React.FC<GitProfileIdentityFieldsProps> = ({
  activeScope,
  isOverride,
  userName,
  onUserNameChange,
  userEmail,
  onUserEmailChange,
  defaultBranch,
  onDefaultBranchChange,
}) => {
  const { t } = useTranslation();
  const disabled = activeScope === "repo" && !isOverride;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="user-name" className="text-xs font-medium text-primary">
            {t.settings.profile.userNameLabel}
          </label>
          <GitProfileScopeBadge activeScope={activeScope} isOverride={isOverride} />
        </div>
        <Input
          id="user-name"
          size="md"
          mono
          disabled={disabled}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder={t.settings.profile.userNamePlaceholder}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="user-email" className="text-xs font-medium text-primary">
            {t.settings.profile.userEmailLabel}
          </label>
          <GitProfileScopeBadge activeScope={activeScope} isOverride={isOverride} />
        </div>
        <Input
          id="user-email"
          size="md"
          mono
          type="email"
          disabled={disabled}
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          placeholder={t.settings.profile.userEmailPlaceholder}
        />
      </div>

      {activeScope === "global" && (
        <div>
          <label htmlFor="default-branch" className="text-xs font-medium text-primary block mb-1.5">
            {t.settings.profile.defaultBranchLabel}
          </label>
          <Input
            id="default-branch"
            size="md"
            mono
            value={defaultBranch}
            onChange={(e) => onDefaultBranchChange(e.target.value)}
            placeholder={t.settings.profile.defaultBranchPlaceholder}
          />
        </div>
      )}
    </>
  );
};
