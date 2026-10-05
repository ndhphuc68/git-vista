import React from "react";
import { useTranslation } from "../../../i18n";
import type { GitConfigDto } from "../../../ipc/client";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { SettingsInheritRow, SettingsPage, SettingsSaveBar } from "../../../features/settings";
import { useGitProfileForm } from "./useGitProfileForm";
import { GitProfileIdentitySection } from "./GitProfileIdentitySection";
import { GitProfileSigningSection } from "./GitProfileSigningSection";
import { GitProfileCommitSection } from "./GitProfileCommitSection";
import { SETTINGS_SCOPE, type SettingsScope } from "../../../domain/enums";

interface GitProfileTabProps {
  currentRepoPath: string | null;
  scope?: SettingsScope;
  /** Scope selector rendered under the page header. */
  toolbar?: React.ReactNode;
}

function formatIdentity(config: GitConfigDto | null): string {
  if (!config?.userName) return "";
  return config.userEmail ? `${config.userName} <${config.userEmail}>` : config.userName;
}

interface GitProfileTabBodyProps {
  currentRepoPath: string | null;
  activeScope: SettingsScope;
}

/** Form and sections of the profile tab; remounted when the scope or repository changes. */
const GitProfileTabBody: React.FC<GitProfileTabBodyProps> = ({ currentRepoPath, activeScope }) => {
  const { t } = useTranslation();
  const { commitMessageLimit, setCommitMessageLimit } = useSettingsStore();
  const form = useGitProfileForm({ currentRepoPath, activeScope });
  const isRepoScope = activeScope === SETTINGS_SCOPE.REPO && Boolean(currentRepoPath);
  const locked = isRepoScope && !form.isOverride;

  return (
    <form onSubmit={form.handleSave}>
      <div className="space-y-6">
        {isRepoScope && (
          <SettingsInheritRow
            inheriting={!form.isOverride}
            onInheritChange={(inherit) =>
              inherit ? form.handleSelectInherit() : form.handleSelectOverride()
            }
            description={formatIdentity(form.globalConfig)}
            disabled={form.saving || form.loading}
            canReset={form.hasLocalOverride}
            onReset={form.handleResetToGlobal}
          />
        )}
        <GitProfileIdentitySection
          showDefaultBranch={activeScope === SETTINGS_SCOPE.GLOBAL}
          locked={locked}
          userName={form.userName}
          onUserNameChange={form.setUserName}
          userEmail={form.userEmail}
          onUserEmailChange={form.setUserEmail}
          defaultBranch={form.defaultBranch}
          onDefaultBranchChange={form.setDefaultBranch}
        />
        <GitProfileSigningSection
          locked={locked}
          gpgSign={form.gpgSign}
          onGpgSignChange={form.setGpgSign}
          gpgKey={form.gpgKey}
          onGpgKeyChange={form.setGpgKey}
        />
        <GitProfileCommitSection
          commitMessageLimit={commitMessageLimit}
          onCommitMessageLimitChange={setCommitMessageLimit}
        />
      </div>
      <SettingsSaveBar
        visible={form.isDirty && !form.loading}
        saving={form.saving}
        saveDisabled={form.saving || form.loading}
        saveLabel={t.settings.profile.saveBtn}
        onDiscard={form.handleDiscard}
      />
    </form>
  );
};

export const GitProfileTab: React.FC<GitProfileTabProps> = ({
  currentRepoPath,
  scope: propScope,
  toolbar,
}) => {
  const { t } = useTranslation();
  const activeScope = propScope || (currentRepoPath ? SETTINGS_SCOPE.REPO : SETTINGS_SCOPE.GLOBAL);

  return (
    <SettingsPage
      title={t.settings.profile.title}
      description={t.settings.profile.subtitle}
      toolbar={toolbar}
    >
      <GitProfileTabBody
        key={`${activeScope}-${currentRepoPath}`}
        currentRepoPath={currentRepoPath}
        activeScope={activeScope}
      />
    </SettingsPage>
  );
};
