import React from "react";
import { useTranslation } from "../../../i18n";
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
        <input
          id="user-name"
          type="text"
          disabled={disabled}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder={t.settings.profile.userNamePlaceholder}
          className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="user-email" className="text-xs font-medium text-primary">
            {t.settings.profile.userEmailLabel}
          </label>
          <GitProfileScopeBadge activeScope={activeScope} isOverride={isOverride} />
        </div>
        <input
          id="user-email"
          type="email"
          disabled={disabled}
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          placeholder={t.settings.profile.userEmailPlaceholder}
          className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        />
      </div>

      {activeScope === "global" && (
        <div>
          <label htmlFor="default-branch" className="text-xs font-medium text-primary block mb-1.5">
            {t.settings.profile.defaultBranchLabel}
          </label>
          <input
            id="default-branch"
            type="text"
            value={defaultBranch}
            onChange={(e) => onDefaultBranchChange(e.target.value)}
            placeholder={t.settings.profile.defaultBranchPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors font-mono"
          />
        </div>
      )}
    </>
  );
};
