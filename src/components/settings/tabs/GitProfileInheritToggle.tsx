import React from "react";
import { useTranslation } from "../../../i18n";
import type { GitConfigDto } from "../../../ipc/client";
import { HelpTooltip } from "../HelpTooltip";

export interface GitProfileInheritToggleProps {
  isOverride: boolean;
  globalConfig: GitConfigDto | null;
  onSelectInherit: () => void;
  onSelectOverride: () => void;
}

/** Inherit-from-global vs. override-for-this-repo radio toggle, shown only in repo scope. */
export const GitProfileInheritToggle: React.FC<GitProfileInheritToggleProps> = ({
  isOverride,
  globalConfig,
  onSelectInherit,
  onSelectOverride,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.profile.scopeLabel}
        </label>
        <HelpTooltip
          title={t.settings.help.profileScopeTitle}
          description={t.settings.help.profileScopeDesc}
          tag={t.settings.help.tagWorkflow}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            !isOverride
              ? "border-accent bg-accent/10 text-primary"
              : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
          }`}
        >
          <input
            type="radio"
            name="repo-profile-inherit-mode"
            data-testid="inherit-toggle-inherit"
            checked={!isOverride}
            onChange={onSelectInherit}
            className="accent-accent"
          />
          <div className="text-xs font-medium">
            <div>{t.settings.profile.inheritGlobalOption}</div>
            <div className="text-[11px] text-secondary mt-0.5">
              {globalConfig?.userName
                ? `(${globalConfig.userName} <${globalConfig.userEmail}>)`
                : ""}
            </div>
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            isOverride
              ? "border-accent bg-accent/10 text-primary"
              : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
          }`}
        >
          <input
            type="radio"
            name="repo-profile-inherit-mode"
            data-testid="inherit-toggle-override"
            checked={isOverride}
            onChange={onSelectOverride}
            className="accent-accent"
          />
          <div className="text-xs font-medium">
            <div>{t.settings.profile.overrideRepoOption}</div>
            <div className="text-[11px] text-secondary mt-0.5">
              {t.settings.profile.scopeLocalDesc}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
