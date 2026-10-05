import React, { useEffect } from "react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";
import { RemoteProgressBanner } from "../common/RemoteProgressBanner";

import { useAutoFetch, useRemoteTask } from "../../features/remote/api";
import { useRepoStatus } from "../../features/history";
import { useRepoHeadInfo } from "../../features/repo";
import { useGitHubRepoInfo } from "../../features/github";
import { usePullRequests } from "../../features/pullrequests";
import { useRepoHeaderShortcuts } from "./useRepoHeaderShortcuts";
import { RepoHeaderScreenSwitcher } from "./RepoHeaderScreenSwitcher";
import { RepoHeaderGitActions } from "./RepoHeaderGitActions";
import {
  detectIsMac,
  getShortcutLabels,
  countTotalChanges,
  countAheadBehind,
} from "./repoHeaderDisplay";

interface RepoHeaderProps {
  onBackToWelcome?: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome: _onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const { activeScreen, setActiveScreen } = useViewStore();
  const { sidebarOpen, toggleSidebar } = useLayoutStore();
  const { openSettings } = useSettingsStore();
  const { t, actions } = useTranslation();

  const repoPath = currentRepo?.path;
  const repoPathOrEmpty = repoPath ?? "";

  const { data: repoStatus } = useRepoStatus(repoPathOrEmpty);
  const { data: headInfo } = useRepoHeadInfo(repoPath);
  const { data: repoInfo } = useGitHubRepoInfo(repoPathOrEmpty);
  const { data: openPrs } = usePullRequests(repoPathOrEmpty);

  const hasUpstream = Boolean(headInfo?.upstream);
  const remote = useRemoteTask(repoPath, hasUpstream);
  useAutoFetch(repoPath, remote.isPending);
  const isGitHub = Boolean(repoInfo?.is_github);

  const { shortcutLabel1, shortcutLabel2, shortcutLabel3, shortcutSidebar } =
    getShortcutLabels(detectIsMac());

  useRepoHeaderShortcuts(currentRepo, setActiveScreen, toggleSidebar, isGitHub);

  useEffect(() => {
    if (repoInfo && !repoInfo.is_github && activeScreen === "pull-requests") {
      setActiveScreen("history");
    }
  }, [repoInfo, activeScreen, setActiveScreen]);

  if (!currentRepo) return null;

  const totalChanges = countTotalChanges(repoStatus);
  const { aheadCount, behindCount } = countAheadBehind(headInfo);

  return (
    <>
      <header
        data-testid="repo-header"
        className="flex items-center justify-between px-3 bg-surface border-b border-border-subtle h-11 min-h-11 max-h-11 shrink-0 gap-3 select-none z-20"
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
          shortcutLabel3={shortcutLabel3}
          totalChanges={totalChanges}
          isGitHub={isGitHub}
          openPrCount={openPrs?.length}
        />

        <RepoHeaderGitActions
          t={t}
          actions={actions}
          repoPath={repoPath}
          remote={remote}
          aheadCount={aheadCount}
          behindCount={behindCount}
          hasUpstream={hasUpstream}
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
