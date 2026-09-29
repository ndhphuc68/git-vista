import React from "react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";
import { RemoteProgressBanner } from "../common/RemoteProgressBanner";

import { useRemoteTask } from "../../features/remote/api";
import { useRepoStatus } from "../../features/history";
import { useRepoHeadInfo } from "../../features/repo";
import { useRepoHeaderShortcuts } from "./useRepoHeaderShortcuts";
import { RepoHeaderScreenSwitcher } from "./RepoHeaderScreenSwitcher";
import { RepoHeaderGitActions } from "./RepoHeaderGitActions";
import { detectIsMac, getShortcutLabels, countTotalChanges, countAheadBehind } from "./repoHeaderDisplay";

interface RepoHeaderProps {
  onBackToWelcome?: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome: _onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const { activeScreen, setActiveScreen } = useViewStore();
  const { sidebarOpen, toggleSidebar } = useLayoutStore();
  const { openSettings } = useSettingsStore();
  const { t, actions } = useTranslation();

  const { data: repoStatus } = useRepoStatus(currentRepo?.path ?? "");

  const { data: headInfo } = useRepoHeadInfo(currentRepo?.path);

  const remote = useRemoteTask(currentRepo?.path, Boolean(headInfo?.upstream));

  const { shortcutLabel1, shortcutLabel2, shortcutSidebar } = getShortcutLabels(detectIsMac());

  useRepoHeaderShortcuts(currentRepo, setActiveScreen, toggleSidebar);

  if (!currentRepo) return null;

  const totalChanges = countTotalChanges(repoStatus);
  const { aheadCount, behindCount } = countAheadBehind(headInfo);

  return (
    <>
      <header
        data-testid="repo-header"
        className="flex items-center justify-between px-3 bg-surface border-b border-border-subtle h-[40px] min-h-[40px] max-h-[40px] shrink-0 gap-3 select-none z-20"
      >
        <RepoHeaderScreenSwitcher
          t={t}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          shortcutSidebar={shortcutSidebar}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          shortcutLabel1={shortcutLabel1}
          shortcutLabel2={shortcutLabel2}
          totalChanges={totalChanges}
        />

        <RepoHeaderGitActions
          t={t}
          actions={actions}
          repoPath={currentRepo?.path}
          remote={remote}
          aheadCount={aheadCount}
          behindCount={behindCount}
          hasUpstream={Boolean(headInfo?.upstream)}
          onOpenSettings={() => openSettings("appearance")}
        />
      </header>
      <RemoteProgressBanner
        task={remote.task}
        onCancel={remote.cancel}
        onRetry={remote.retry}
        onDismiss={remote.dismiss}
      />
    </>
  );
};
