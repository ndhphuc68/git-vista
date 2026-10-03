import React from "react";
import { FolderGit2, Globe } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface GitBehaviorScopeBannerProps {
  activeScope: "global" | "repo";
  currentRepoPath: string | null;
  hasLocalOverride: boolean;
  loading: boolean;
  saving: boolean;
  onResetToGlobal: () => void;
}

/** Scope header banner for the git behavior tab: repo-scoped vs. global. */
export const GitBehaviorScopeBanner: React.FC<GitBehaviorScopeBannerProps> = ({
  activeScope,
  currentRepoPath,
  hasLocalOverride,
  loading,
  saving,
  onResetToGlobal,
}) => {
  const { t } = useTranslation();

  if (activeScope === "repo" && currentRepoPath) {
    return (
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <FolderGit2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary">
              {t.settings.profile.repoSettingsBanner}{" "}
              <span className="font-mono text-accent">
                {currentRepoPath.split(/[/\\]/).filter(Boolean).pop() || currentRepoPath}
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5">
              {t.settings.profile.repoSettingsDesc}
            </p>
          </div>
        </div>
        {hasLocalOverride && (
          <Button
            variant="secondary"
            data-testid="reset-pull-to-global-btn"
            onClick={onResetToGlobal}
            disabled={saving || loading}
            className="shrink-0"
          >
            {t.settings.behavior.resetToGlobalBtn}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface-header/40 border border-border-subtle flex items-start gap-3">
      <Globe className="w-5 h-5 text-accent mt-0.5 shrink-0" />
      <div>
        <div className="text-xs font-semibold text-primary">{t.settings.profile.scopeGlobal}</div>
        <p className="text-[11px] text-secondary mt-0.5">{t.settings.profile.scopeGlobalDesc}</p>
      </div>
    </div>
  );
};
