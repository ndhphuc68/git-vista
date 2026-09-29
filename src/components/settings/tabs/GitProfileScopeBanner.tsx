import React from "react";
import { Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface GitProfileScopeBannerProps {
  activeScope: "global" | "repo";
  currentRepoPath: string | null;
  hasLocalOverride: boolean;
  saving: boolean;
  loading: boolean;
  onResetToGlobal: () => void;
}

/** Banner announcing the active scope (repo vs. global) for the profile tab. */
export const GitProfileScopeBanner: React.FC<GitProfileScopeBannerProps> = ({
  activeScope,
  currentRepoPath,
  hasLocalOverride,
  saving,
  loading,
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
          <button
            type="button"
            data-testid="reset-to-global-btn"
            onClick={onResetToGlobal}
            disabled={saving || loading}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle text-secondary hover:text-primary text-[11px] font-medium transition-colors cursor-pointer"
          >
            {t.settings.profile.resetToGlobalBtn}
          </button>
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
