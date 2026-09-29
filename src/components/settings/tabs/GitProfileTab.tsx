import React from "react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useGitProfileForm } from "./useGitProfileForm";
import { GitProfileScopeBanner } from "./GitProfileScopeBanner";
import { GitProfileInheritToggle } from "./GitProfileInheritToggle";
import { GitProfileIdentityFields } from "./GitProfileIdentityFields";
import { GitProfileGpgSection } from "./GitProfileGpgSection";
import { GitProfileCommitConventionsSection } from "./GitProfileCommitConventionsSection";
import { GitProfileSaveButton } from "./GitProfileSaveButton";

interface GitProfileTabProps {
  currentRepoPath: string | null;
  scope?: "global" | "repo";
  onScopeChange?: (scope: "global" | "repo") => void;
}

export const GitProfileTab: React.FC<GitProfileTabProps> = ({
  currentRepoPath,
  scope: propScope,
}) => {
  const { commitMessageLimit, setCommitMessageLimit } = useSettingsStore();

  const activeScope = propScope || (currentRepoPath ? "repo" : "global");

  const {
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    defaultBranch,
    setDefaultBranch,
    gpgSign,
    setGpgSign,
    gpgKey,
    setGpgKey,
    globalConfig,
    isOverride,
    loading,
    saving,
    hasLocalOverride,
    handleSave,
    handleResetToGlobal,
    handleSelectInherit,
    handleSelectOverride,
  } = useGitProfileForm({ currentRepoPath, activeScope });

  return (
    <div className="space-y-6">
      <GitProfileScopeBanner
        activeScope={activeScope}
        currentRepoPath={currentRepoPath}
        hasLocalOverride={hasLocalOverride}
        saving={saving}
        loading={loading}
        onResetToGlobal={handleResetToGlobal}
      />

      {activeScope === "repo" && currentRepoPath && (
        <GitProfileInheritToggle
          isOverride={isOverride}
          globalConfig={globalConfig}
          onSelectInherit={handleSelectInherit}
          onSelectOverride={handleSelectOverride}
        />
      )}

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <GitProfileIdentityFields
          activeScope={activeScope}
          isOverride={isOverride}
          userName={userName}
          onUserNameChange={setUserName}
          userEmail={userEmail}
          onUserEmailChange={setUserEmail}
          defaultBranch={defaultBranch}
          onDefaultBranchChange={setDefaultBranch}
        />

        <GitProfileGpgSection
          activeScope={activeScope}
          isOverride={isOverride}
          gpgSign={gpgSign}
          onToggleGpgSign={() => setGpgSign(!gpgSign)}
          gpgKey={gpgKey}
          onGpgKeyChange={setGpgKey}
        />

        <GitProfileCommitConventionsSection
          commitMessageLimit={commitMessageLimit}
          onCommitMessageLimitChange={setCommitMessageLimit}
        />

        <GitProfileSaveButton
          saving={saving}
          disabled={saving || loading || (activeScope === "repo" && !isOverride)}
        />
      </form>
    </div>
  );
};
