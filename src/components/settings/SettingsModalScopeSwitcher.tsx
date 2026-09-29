import React from "react";
import { Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../i18n";
import { type TabItem } from "../../types/tab";

export interface SettingsModalScopeSwitcherProps {
  currentRepoPath: string;
  effectiveScope: "global" | "repo";
  setScope: (scope: "global" | "repo") => void;
  openRepoTabs: TabItem[];
  selectedRepoPath: string;
  setSelectedRepoPath: (path: string) => void;
  activeRepo: TabItem | null | undefined;
  getRepoDisplayName: (path: string) => string;
}

/** 2-tier scope switcher (global vs. repo), shown only while a repository is open. */
export const SettingsModalScopeSwitcher: React.FC<SettingsModalScopeSwitcherProps> = ({
  currentRepoPath,
  effectiveScope,
  setScope,
  openRepoTabs,
  selectedRepoPath,
  setSelectedRepoPath,
  activeRepo,
  getRepoDisplayName,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="scope-switcher"
      className="flex items-center bg-surface-header/80 p-1 rounded-xl border border-border-subtle text-xs shrink-0"
    >
      <button
        type="button"
        data-testid="scope-btn-global"
        data-active={effectiveScope === "global"}
        onClick={() => setScope("global")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
          effectiveScope === "global"
            ? "bg-accent text-white font-semibold shadow-xs"
            : "text-secondary hover:text-primary hover:bg-surface-hover"
        }`}
      >
        <Globe size={14} />
        <span>{t.settings.scopeSwitcher.global}</span>
      </button>

      <button
        type="button"
        data-testid="scope-btn-repo"
        data-active={effectiveScope === "repo"}
        onClick={() => setScope("repo")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
          effectiveScope === "repo"
            ? "bg-accent text-white font-semibold shadow-xs"
            : "text-secondary hover:text-primary hover:bg-surface-hover"
        }`}
      >
        <FolderGit2 size={14} />
        <span>{t.settings.scopeSwitcher.repo}</span>

        {openRepoTabs.length > 1 && (
          <select
            data-testid="scope-repo-select"
            value={selectedRepoPath || currentRepoPath}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              setSelectedRepoPath(e.target.value);
              setScope("repo");
            }}
            className="ml-1 bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-xs text-primary font-mono cursor-pointer outline-hidden"
          >
            {openRepoTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.alias || tab.repo?.name || getRepoDisplayName(tab.id)}
              </option>
            ))}
          </select>
        )}

        {openRepoTabs.length <= 1 && (
          <span className="ml-1 font-mono text-[11px] opacity-85">
            (
            {activeRepo?.alias || activeRepo?.repo?.name || getRepoDisplayName(currentRepoPath)}
            )
          </span>
        )}
      </button>
    </div>
  );
};
