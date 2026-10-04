import React from "react";
import { Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl, Select } from "../../../shared/ui";
import type { RepoChoice } from "../settingsModalState.helpers";

export interface SettingsScopeSelectorProps {
  hasRepo: boolean;
  scope: "global" | "repo";
  onScopeChange: (scope: "global" | "repo") => void;
  repos: RepoChoice[];
  selectedRepoPath: string;
  onRepoChange: (path: string) => void;
}

const LABEL_ID = "settings-scope-label";

/** "Apply to: Global | repo" picker shown at the top of the Git config tabs. */
export const SettingsScopeSelector: React.FC<SettingsScopeSelectorProps> = ({
  hasRepo,
  scope,
  onScopeChange,
  repos,
  selectedRepoPath,
  onRepoChange,
}) => {
  const { t } = useTranslation();
  const globalLabel = (
    <>
      <Globe size={14} />
      <span>{t.settings.profile.scopeGlobal}</span>
    </>
  );

  if (!hasRepo) {
    return (
      <div className="flex items-center gap-2 text-xs text-secondary">
        <span>{t.settings.scope.applyTo}</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-primary">
          {globalLabel}
        </span>
      </div>
    );
  }

  const repoLabel = repos.find((repo) => repo.path === selectedRepoPath)?.label ?? "";

  return (
    <div data-testid="scope-switcher" className="flex flex-wrap items-center gap-3">
      <span id={LABEL_ID} className="text-xs text-secondary">
        {t.settings.scope.applyTo}
      </span>
      <SegmentedControl
        aria-labelledby={LABEL_ID}
        value={scope}
        onChange={onScopeChange}
        options={[
          { value: "global", label: globalLabel, testId: "scope-btn-global" },
          {
            value: "repo",
            label: (
              <>
                <FolderGit2 size={14} />
                <span className="font-mono">{repoLabel}</span>
              </>
            ),
            testId: "scope-btn-repo",
          },
        ]}
      />
      {scope === "repo" && repos.length > 1 && (
        <Select
          data-testid="scope-repo-select"
          aria-label={t.settings.scopeSwitcher.selectRepo}
          value={selectedRepoPath}
          onChange={onRepoChange}
          options={repos.map((repo) => ({ value: repo.path, label: repo.label }))}
          mono
          className="w-48"
        />
      )}
    </div>
  );
};
