import React from "react";
import { RefreshCw, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "../../domain/queryKeys";
import { type Translations } from "../../i18n/vi";
import { type useRemoteTask } from "../../features/remote/api";
import { RepoHeaderRemoteButtons } from "./RepoHeaderRemoteButtons";

interface RepoHeaderGitActionsProps {
  t: Translations;
  actions: Translations["gitActions"]["advanced"];
  repoPath: string | undefined;
  remote: ReturnType<typeof useRemoteTask>;
  aheadCount: number;
  behindCount: number;
  hasUpstream: boolean;
  onOpenSettings: () => void;
}

/** GitKraken-style fetch/pull/push cluster plus the refresh and settings buttons. */
export const RepoHeaderGitActions: React.FC<RepoHeaderGitActionsProps> = ({
  t,
  actions,
  repoPath,
  remote,
  aheadCount,
  behindCount,
  hasUpstream,
  onOpenSettings,
}) => {
  const queryClient = useQueryClient();

  return (
    <div className="flex items-center gap-2 shrink-0">
      <RepoHeaderRemoteButtons
        t={t}
        actions={actions}
        remote={remote}
        aheadCount={aheadCount}
        behindCount={behindCount}
        hasUpstream={hasUpstream}
      />

      {/* Right-side toolbar: Refresh & Settings */}
      <div className="flex items-center gap-1 pl-1 border-l border-border-subtle relative">
        {/* Refresh button */}
        <button
          onClick={() =>
            // The button's label is "Refresh repository" (singular): only refresh
            // the current repo's cache, don't touch other repos open in other tabs.
            queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath ?? "") })
          }
          className="flex items-center justify-center w-7 h-7 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs"
          title={t.header.refreshRepo}
        >
          <RefreshCw size={12} />
        </button>

        {/* Settings modal trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer transition-colors shadow-2xs bg-surface text-secondary hover:bg-surface-hover hover:text-primary"
          title={t.header.settingsTitle}
          aria-label={t.settings.title}
        >
          <Settings size={13} />
        </button>
      </div>
    </div>
  );
};
