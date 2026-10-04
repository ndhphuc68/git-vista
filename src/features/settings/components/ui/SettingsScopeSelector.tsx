import React from "react";
import { Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../../../i18n";
import { SegmentedControl } from "../../../../shared/ui";

export interface SettingsScopeSelectorProps {
  hasRepo: boolean;
  scope: "global" | "repo";
  onScopeChange: (scope: "global" | "repo") => void;
  /** Display name of the repository open in the current tab. */
  repoLabel: string;
}

const LABEL_ID = "settings-scope-label";

/** "Apply to: Global | current repo" picker shown at the top of the Git config tabs. */
export const SettingsScopeSelector: React.FC<SettingsScopeSelectorProps> = ({
  hasRepo,
  scope,
  onScopeChange,
  repoLabel,
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

  const hint =
    scope === "repo"
      ? t.settings.scope.repoOnlyHint.replace("{repo}", repoLabel)
      : t.settings.scope.globalHint;

  return (
    <div data-testid="scope-switcher" className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
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
      </div>
      <p data-testid="scope-hint" className="m-0 text-xs text-secondary">
        {hint}
      </p>
    </div>
  );
};
