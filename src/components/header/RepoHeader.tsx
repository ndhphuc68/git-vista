import React, { useEffect } from "react";
import clsx from "clsx";
import {
  RefreshCw,
  History,
  FileDiff,
  PanelLeft,
  ArrowDown,
  ArrowUp,
  Settings,
} from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";
import { invokeCommand } from "../../ipc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RemoteProgressBanner,
} from "../common/RemoteProgressBanner";

import { useRemoteTask } from "../../hooks/useRemoteTask";

interface RepoHeaderProps {
  onBackToWelcome?: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome: _onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const { activeScreen, setActiveScreen } = useViewStore();
  const {
    sidebarOpen,
    toggleSidebar,
  } = useLayoutStore();
  const { openSettings } = useSettingsStore();
  const { t, actions } = useTranslation();
  const queryClient = useQueryClient();

  const { data: repoStatus } = useQuery({
    queryKey: ["repoStatus", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo?.path),
  });

  const { data: headInfo } = useQuery({
    queryKey: ["repoHeadInfo", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoHeadInfo(currentRepo!.path),
    enabled: Boolean(currentRepo?.path),
  });

  const remote = useRemoteTask(currentRepo?.path, Boolean(headInfo?.upstream));
  const activeRemoteTask = remote.task;
  const isRemotePending = remote.isPending;

  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(
      navigator.platform || navigator.userAgent || ""
    );
  const shortcutLabel1 = isMac ? "Cmd+1" : "Ctrl+1";
  const shortcutLabel2 = isMac ? "Cmd+2" : "Ctrl+2";
  const shortcutSidebar = isMac ? "Cmd+B" : "Ctrl+B";

  useEffect(() => {
    if (!currentRepo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        setActiveScreen("history");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        setActiveScreen("changes");
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "b" || e.key === "B")
      ) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentRepo, setActiveScreen, toggleSidebar]);

  if (!currentRepo) return null;

  const stagedCount = repoStatus?.staged?.length ?? 0;
  const unstagedCount = repoStatus?.unstaged?.length ?? 0;
  const untrackedCount = repoStatus?.untracked?.length ?? 0;
  const totalChanges = stagedCount + unstagedCount + untrackedCount;

  const aheadCount = headInfo?.ahead ?? 0;
  const behindCount = headInfo?.behind ?? 0;

  const isHistoryActive = activeScreen === "history";
  const isChangesActive = activeScreen === "changes";

  return (
    <>
      <header
        data-testid="repo-header"
        className="flex items-center justify-between px-3 bg-surface border-b border-border-subtle h-[40px] min-h-[40px] max-h-[40px] shrink-0 gap-3 select-none z-20"
      >
        {/* Khối Trái: Sidebar toggle & Screen Switcher Tabs */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <button
            type="button"
            data-testid="toggle-sidebar"
            onClick={toggleSidebar}
            className={clsx(
              "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer shrink-0 transition-colors shadow-2xs",
              sidebarOpen ? "bg-accent-subtle text-accent font-semibold" : "bg-transparent text-secondary hover:bg-surface-hover hover:text-primary"
            )}
            title={t.header.toggleSidebar.replace("{shortcut}", shortcutSidebar)}
          >
            <PanelLeft size={14} />
          </button>

          {/* Segmented Screen Switcher (Lịch sử & Thay đổi) */}
          <div
            role="tablist"
            aria-label="Màn hình làm việc"
            className="flex items-center gap-0.5 bg-window p-0.5 rounded-lg border border-border-subtle shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isHistoryActive}
              data-testid="tab-history"
              onClick={() => setActiveScreen("history")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 btn-press",
                isHistoryActive
                  ? "bg-surface text-primary shadow-xs border border-border-subtle font-bold"
                  : "bg-transparent text-secondary hover:text-primary font-medium"
              )}
              title={`History (${shortcutLabel1})`}
            >
              <History size={13} className={isHistoryActive ? "text-accent" : "text-secondary"} />
              <span>{t.screens.history}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isChangesActive}
              data-testid="tab-changes"
              onClick={() => setActiveScreen("changes")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 btn-press",
                isChangesActive
                  ? "bg-surface text-primary shadow-xs border border-border-subtle font-bold"
                  : "bg-transparent text-secondary hover:text-primary font-medium"
              )}
              title={`Changes (${shortcutLabel2})`}
            >
              <FileDiff size={13} className={isChangesActive ? "text-accent" : "text-secondary"} />
              <span>{t.screens.changes}</span>
              {totalChanges > 0 && (
                <span
                  data-testid="changes-badge"
                  className="inline-flex items-center justify-center px-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 leading-none animate-scale-in"
                >
                  {totalChanges}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Khối Thao tác Git Kiểu GitKraken (Connected Segmented Cluster) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-surface border border-border-subtle rounded-md p-0.5 shadow-2xs divide-x divide-border-subtle">
            {/* Fetch */}
            <button
              type="button"
              data-testid="btn-fetch"
              onClick={() => void remote.run("fetch")}
              disabled={isRemotePending}
              className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 btn-press"
              title={t.header.fetchTitle}
            >
              <RefreshCw size={12} className={isRemotePending && activeRemoteTask?.operation === "fetch" ? "animate-spin" : ""} />
              <span>{actions.fetch}</span>
            </button>

            {/* Pull */}
            <button
              type="button"
              data-testid="btn-pull"
              onClick={() => void remote.run("pull")}
              disabled={isRemotePending}
              className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 btn-press"
              title={t.header.pullTitle}
            >
              <ArrowDown size={12} className="text-accent" />
              <span>{actions.pull}</span>
              {behindCount > 0 && (
                <span
                  data-testid="behind-badge"
                  className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 leading-none font-mono animate-scale-in"
                  title={t.header.commitsBehind.replace("{count}", String(behindCount))}
                >
                  {behindCount}
                </span>
              )}
            </button>

            {/* Push */}
            <button
              type="button"
              data-testid="btn-push"
              onClick={() => void remote.run("push")}
              disabled={isRemotePending}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50 btn-press",
                aheadCount > 0
                  ? "bg-accent text-accent-contrast font-bold hover:bg-accent-hover rounded-r-xs"
                  : "text-secondary hover:text-primary hover:bg-surface-hover font-medium"
              )}
              title={headInfo?.upstream ? t.header.pushNormal : t.header.pushUpstream}
            >
              <ArrowUp size={12} />
              <span>{actions.push}</span>
              {aheadCount > 0 && (
                <span
                  data-testid="ahead-badge"
                  className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-white/30 text-white leading-none font-mono animate-scale-in"
                  title={t.header.commitsAhead.replace("{count}", String(aheadCount))}
                >
                  {aheadCount}
                </span>
              )}
            </button>
          </div>

          {/* Khối Công Cụ Phải: Refresh & Settings */}
          <div className="flex items-center gap-1 pl-1 border-l border-border-subtle relative">

            {/* Refresh button */}
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center justify-center w-7 h-7 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs"
              title={t.header.refreshRepo}
            >
              <RefreshCw size={12} />
            </button>

            {/* Settings modal trigger */}
            <button
              type="button"
              onClick={() => openSettings("appearance")}
              className="flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer transition-colors shadow-2xs bg-surface text-secondary hover:bg-surface-hover hover:text-primary"
              title={t.header.settingsTitle}
              aria-label={t.settings.title}
            >
              <Settings size={13} />
            </button>
          </div>
        </div>
      </header>
      <RemoteProgressBanner
        task={activeRemoteTask}
        onCancel={remote.cancel}
        onRetry={remote.retry}
        onDismiss={remote.dismiss}
      />
    </>
  );
};
