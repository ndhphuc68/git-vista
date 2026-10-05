import React from "react";
import { Code2, RefreshCw, Settings, SquareTerminal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "../../domain/queryKeys";
import { type Translations } from "../../i18n/vi";
import { type useRemoteTask } from "../../features/remote/api";
import { RepoHeaderRemoteButtons } from "./RepoHeaderRemoteButtons";
import { openRepoInEditor, openRepoInTerminal } from "./RepoHeaderGitActions.actions";

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

/** GitKraken-style fetch/pull/push cluster plus the refresh, open-in-editor, open-in-terminal and settings buttons. */
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
          className="flex items-center justify-center w-8 h-8 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs"
          title={t.header.refreshRepo}
        >
          <RefreshCw size={15} />
        </button>

        {/* Open the repo in the external editor chosen in settings */}
        <button
          type="button"
          data-testid="btn-open-in-editor"
          onClick={() => repoPath && void openRepoInEditor(repoPath, t)}
          disabled={!repoPath}
          className="flex items-center justify-center w-8 h-8 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs disabled:opacity-50"
          title={t.header.openInEditor}
          aria-label={t.header.openInEditor}
        >
          <Code2 size={16} />
        </button>

        {/* Open the repo in the terminal chosen in settings */}
        <button
          type="button"
          data-testid="btn-open-in-terminal"
          onClick={() => repoPath && void openRepoInTerminal(repoPath, t)}
          disabled={!repoPath}
          className="flex items-center justify-center w-8 h-8 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs disabled:opacity-50"
          title={t.header.openInTerminal}
          aria-label={t.header.openInTerminal}
        >
          <SquareTerminal size={16} />
        </button>

        {/* Settings modal trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 border border-border-subtle rounded-md cursor-pointer transition-colors shadow-2xs bg-surface text-secondary hover:bg-surface-hover hover:text-primary"
          title={t.header.settingsTitle}
          aria-label={t.settings.title}
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
