import React, { useEffect, useState } from "react";
import clsx from "clsx";
import {
  FolderGit2,
  GitBranch,
  ArrowLeft,
  RefreshCw,
  History,
  FileDiff,
  PanelLeft,
  PanelRight,
  SlidersHorizontal,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import { useTranslation } from "../../i18n";
import { invokeCommand, listenToTaskProgress } from "../../ipc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RemoteProgressBanner,
  RemoteTaskState,
} from "../common/RemoteProgressBanner";

interface RepoHeaderProps {
  onBackToWelcome: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const { activeScreen, setActiveScreen } = useViewStore();
  const {
    sidebarOpen,
    toggleSidebar,
    detailPanelOpen,
    toggleDetailPanel,
    controlsOpen,
    toggleControls,
  } = useLayoutStore();
  const { isMobile } = useWindowDimensions();
  const { t } = useTranslation();
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

  const [activeRemoteTask, setActiveRemoteTask] = useState<RemoteTaskState | null>(null);
  const [isRemotePending, setIsRemotePending] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenToTaskProgress((payload) => {
      setActiveRemoteTask((prev) => {
        if (!prev || prev.taskId !== payload.task_id) return prev;
        return {
          ...prev,
          progressPercent: payload.progress_percent,
          statusText: payload.status_text,
        };
      });
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleFetch = async () => {
    if (!currentRepo || isRemotePending) return;
    const taskId = `task-fetch-${Date.now()}`;
    setActiveRemoteTask({
      taskId,
      title: "Đang Fetch từ remote",
      statusText: "Bắt đầu...",
      progressPercent: 0,
    });
    setIsRemotePending(true);
    try {
      await invokeCommand.fetchRepo(currentRepo.path, undefined, false, taskId);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsRemotePending(false);
      setTimeout(() => setActiveRemoteTask(null), 1000);
    }
  };

  const handlePull = async () => {
    if (!currentRepo || isRemotePending) return;
    const taskId = `task-pull-${Date.now()}`;
    setActiveRemoteTask({
      taskId,
      title: "Đang kéo dữ liệu (Pull)",
      statusText: "Bắt đầu...",
      progressPercent: 0,
    });
    setIsRemotePending(true);
    try {
      await invokeCommand.pullRepo(currentRepo.path, undefined, undefined, undefined, taskId);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Pull failed", err);
    } finally {
      setIsRemotePending(false);
      setTimeout(() => setActiveRemoteTask(null), 1000);
    }
  };

  const handlePush = async () => {
    if (!currentRepo || isRemotePending) return;
    const taskId = `task-push-${Date.now()}`;
    const setUpstream = !headInfo?.upstream;
    setActiveRemoteTask({
      taskId,
      title: "Đang đẩy dữ liệu (Push)",
      statusText: "Bắt đầu...",
      progressPercent: 0,
    });
    setIsRemotePending(true);
    try {
      await invokeCommand.pushRepo(currentRepo.path, undefined, undefined, setUpstream, false, taskId);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Push failed", err);
    } finally {
      setIsRemotePending(false);
      setTimeout(() => setActiveRemoteTask(null), 1000);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await invokeCommand.cancelRemoteTask(taskId);
    } finally {
      setActiveRemoteTask(null);
      setIsRemotePending(false);
    }
  };

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
        className="flex items-center justify-between px-3 bg-surface border-b border-border-subtle h-[44px] min-h-[44px] max-h-[44px] shrink-0 gap-2 overflow-hidden"
      >
      {/* Left section: Sidebar toggle, Back, Repo info */}
      <div className="flex items-center gap-2 min-w-0 flex-1 shrink">
        <button
          type="button"
          data-testid="toggle-sidebar"
          onClick={toggleSidebar}
          className={clsx(
            "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-sm cursor-pointer shrink-0",
            sidebarOpen ? "bg-accent-subtle text-accent" : "bg-transparent text-secondary"
          )}
          title={`Bật/tắt thanh bên (${shortcutSidebar})`}
        >
          <PanelLeft size={14} />
        </button>

        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-sm text-secondary text-xs cursor-pointer shrink-0 hover:bg-surface-hover hover:text-primary transition-colors"
          title="Đổi repository"
        >
          <ArrowLeft size={12} />
          {!isMobile && <span>Kho</span>}
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <FolderGit2 size={16} className="text-accent shrink-0" />
          <span
            className={clsx(
              "font-semibold text-xs overflow-hidden text-ellipsis whitespace-nowrap text-primary",
              isMobile ? "max-w-[100px]" : "max-w-[180px]"
            )}
            title={currentRepo.name}
          >
            {currentRepo.name}
          </span>
        </div>

        {currentRepo.head_branch && (
          <div
            className={clsx(
              "flex items-center gap-1 px-2 py-0.5 bg-accent-subtle text-accent rounded-full text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap shrink",
              isMobile ? "max-w-[70px]" : "max-w-[130px]"
            )}
            title={`Branch: ${currentRepo.head_branch}`}
          >
            <GitBranch size={11} className="shrink-0" />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {currentRepo.head_branch}
            </span>
          </div>
        )}

        {/* Remote Operations: Fetch, Pull, Push */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            data-testid="btn-fetch"
            onClick={handleFetch}
            disabled={isRemotePending}
            className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-sm text-secondary hover:text-primary hover:bg-surface-hover text-xs cursor-pointer transition-colors disabled:opacity-50"
            title="Fetch từ remote"
          >
            <RefreshCw size={11} className={isRemotePending && activeRemoteTask?.title.includes("Fetch") ? "animate-spin" : ""} />
            {!isMobile && <span>Fetch</span>}
          </button>

          <button
            type="button"
            data-testid="btn-pull"
            onClick={handlePull}
            disabled={isRemotePending}
            className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-sm text-secondary hover:text-primary hover:bg-surface-hover text-xs cursor-pointer transition-colors disabled:opacity-50"
            title="Pull commit mới từ remote"
          >
            <ArrowDown size={11} />
            {!isMobile && <span>Pull</span>}
            {behindCount > 0 && (
              <span
                data-testid="behind-badge"
                className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 leading-none"
                title={`${behindCount} commit cần pull`}
              >
                {behindCount}
              </span>
            )}
          </button>

          <button
            type="button"
            data-testid="btn-push"
            onClick={handlePush}
            disabled={isRemotePending}
            className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-sm text-secondary hover:text-primary hover:bg-surface-hover text-xs cursor-pointer transition-colors disabled:opacity-50"
            title={headInfo?.upstream ? "Push commit lên remote" : "Push và thiết lập upstream lên remote"}
          >
            <ArrowUp size={11} />
            {!isMobile && <span>Push</span>}
            {aheadCount > 0 && (
              <span
                data-testid="ahead-badge"
                className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 leading-none"
                title={`${aheadCount} commit cần push`}
              >
                {aheadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Center section: Screen switcher tabs */}
      <div
        role="tablist"
        aria-label="Màn hình làm việc"
        className="flex items-center gap-0.5 bg-window p-0.5 rounded-md border border-border-subtle shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isHistoryActive}
          data-testid="tab-history"
          onClick={() => setActiveScreen("history")}
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs cursor-pointer transition-all duration-150 ease-macos",
            isHistoryActive
              ? "bg-surface text-primary border border-accent shadow-sm font-semibold"
              : "bg-transparent text-secondary border border-transparent hover:text-primary font-medium"
          )}
          title={`History (${shortcutLabel1})`}
        >
          <History size={13} className={isHistoryActive ? "text-accent" : "text-current"} />
          <span>{t.screens.history}</span>
          {!isMobile && (
            <span className="text-[10px] opacity-70 ml-0.5">
              {shortcutLabel1}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isChangesActive}
          data-testid="tab-changes"
          onClick={() => setActiveScreen("changes")}
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs cursor-pointer transition-all duration-150 ease-macos",
            isChangesActive
              ? "bg-surface text-primary border border-accent shadow-sm font-semibold"
              : "bg-transparent text-secondary border border-transparent hover:text-primary font-medium"
          )}
          title={`Changes (${shortcutLabel2})`}
        >
          <FileDiff size={13} className={isChangesActive ? "text-accent" : "text-current"} />
          <span>{t.screens.changes}</span>
          {!isMobile && (
            <span className="text-[10px] opacity-70 ml-0.5">
              {shortcutLabel2}
            </span>
          )}
          {totalChanges > 0 && (
            <span
              data-testid="changes-badge"
              className="inline-flex items-center justify-center px-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-semibold bg-accent text-accent-contrast leading-none"
            >
              {totalChanges}
            </span>
          )}
        </button>
      </div>

      {/* Right section: ControlsBar toggle, DetailPanel toggle, Refresh */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          data-testid="toggle-controls"
          onClick={toggleControls}
          className={clsx(
            "flex items-center gap-1 px-2 py-1 border border-border-subtle rounded-sm text-xs cursor-pointer transition-colors",
            controlsOpen ? "bg-accent-subtle text-accent font-medium" : "bg-surface text-secondary hover:text-primary hover:bg-surface-hover"
          )}
          title="Bật/tắt thanh công cụ"
        >
          <SlidersHorizontal size={12} />
          {!isMobile && <span>Thanh công cụ</span>}
        </button>

        {isHistoryActive && (
          <button
            type="button"
            data-testid="toggle-detail-panel"
            onClick={toggleDetailPanel}
            className={clsx(
              "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-sm cursor-pointer transition-colors",
              detailPanelOpen ? "bg-accent-subtle text-accent font-medium" : "bg-surface text-secondary hover:text-primary hover:bg-surface-hover"
            )}
            title="Bật/tắt chi tiết commit"
          >
            <PanelRight size={14} />
          </button>
        )}

        <button
          onClick={() => queryClient.invalidateQueries()}
          className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-sm text-secondary text-xs cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors"
          title="Tải lại dữ liệu repo"
        >
          <RefreshCw size={12} />
          {!isMobile && <span>Làm mới</span>}
        </button>
      </div>
    </header>
    <RemoteProgressBanner
      task={activeRemoteTask}
      onCancel={handleCancelTask}
    />
  </>
);
};
