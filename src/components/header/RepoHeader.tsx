import React, { useEffect, useState, useRef } from "react";
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
  Settings,
  Sun,
  Moon,
  Laptop,
  Languages,
  Terminal,
} from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useSettingsStore, Theme, Locale } from "../../store/useSettingsStore";
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
  const { theme, setTheme, locale, setLocale, mode, setMode } = useSettingsStore();
  const { isMobile } = useWindowDimensions();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        className="flex items-center justify-between px-3 bg-surface border-b border-border-subtle h-[44px] min-h-[44px] max-h-[44px] shrink-0 gap-2 select-none z-20"
      >
        {/* Khối Trái: Sidebar toggle, Nút quay lại, Repo Pill, Branch Pill */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <button
            type="button"
            data-testid="toggle-sidebar"
            onClick={toggleSidebar}
            className={clsx(
              "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer shrink-0 transition-colors",
              sidebarOpen ? "bg-accent-subtle text-accent font-semibold" : "bg-transparent text-secondary hover:bg-surface-hover hover:text-primary"
            )}
            title={`Bật/tắt thanh bên (${shortcutSidebar})`}
          >
            <PanelLeft size={14} />
          </button>

          <button
            onClick={onBackToWelcome}
            className="flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-md text-secondary text-xs cursor-pointer shrink-0 hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs"
            title="Đổi repository"
          >
            <ArrowLeft size={12} />
            {!isMobile && <span>Kho</span>}
          </button>

          {/* Repo Name Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-window border border-border-subtle shadow-2xs text-xs font-bold text-primary max-w-[170px] truncate"
            title={currentRepo.name}
          >
            <FolderGit2 size={13} className="text-accent shrink-0" />
            <span className="truncate">{currentRepo.name}</span>
          </div>

          {/* Active Branch Pill with pulsing indicator */}
          {currentRepo.head_branch && (
            <div
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 bg-diff-add-bg text-diff-add-text border border-diff-add-border rounded-md text-xs font-semibold font-mono overflow-hidden text-ellipsis whitespace-nowrap shrink max-w-[140px] shadow-2xs",
                isMobile && "max-w-[80px]"
              )}
              title={`Branch: ${currentRepo.head_branch}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <GitBranch size={12} className="shrink-0 text-emerald-600" />
              <span className="truncate">{currentRepo.head_branch}</span>
            </div>
          )}
        </div>

        {/* Khối Giữa: Tabs Lịch sử & Thay đổi */}
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
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 ease-macos",
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
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 ease-macos",
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
                className="inline-flex items-center justify-center px-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 leading-none"
              >
                {totalChanges}
              </span>
            )}
          </button>
        </div>

        {/* Khối Thao tác Git Kiểu GitKraken (Connected Segmented Cluster) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-surface border border-border-subtle rounded-md p-0.5 shadow-2xs divide-x divide-border-subtle">
            {/* Fetch */}
            <button
              type="button"
              data-testid="btn-fetch"
              onClick={handleFetch}
              disabled={isRemotePending}
              className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              title="Fetch từ remote"
            >
              <RefreshCw size={12} className={isRemotePending && activeRemoteTask?.title.includes("Fetch") ? "animate-spin" : ""} />
              <span>{mode === "simple" ? "Lấy về" : "Fetch"}</span>
            </button>

            {/* Pull */}
            <button
              type="button"
              data-testid="btn-pull"
              onClick={handlePull}
              disabled={isRemotePending}
              className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              title="Pull commit mới từ remote"
            >
              <ArrowDown size={12} className="text-accent" />
              <span>{mode === "simple" ? "Kéo về" : "Pull"}</span>
              {behindCount > 0 && (
                <span
                  data-testid="behind-badge"
                  className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 leading-none font-mono"
                  title={`${behindCount} commit cần pull`}
                >
                  {behindCount}
                </span>
              )}
            </button>

            {/* Push */}
            <button
              type="button"
              data-testid="btn-push"
              onClick={handlePush}
              disabled={isRemotePending}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50",
                aheadCount > 0
                  ? "bg-accent text-accent-contrast font-bold hover:bg-accent-hover rounded-r-xs"
                  : "text-secondary hover:text-primary hover:bg-surface-hover font-medium"
              )}
              title={headInfo?.upstream ? "Push commit lên remote" : "Push và thiết lập upstream lên remote"}
            >
              <ArrowUp size={12} />
              <span>{mode === "simple" ? "Đẩy lên" : "Push"}</span>
              {aheadCount > 0 && (
                <span
                  data-testid="ahead-badge"
                  className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-white/30 text-white leading-none font-mono"
                  title={`${aheadCount} commit cần push`}
                >
                  {aheadCount}
                </span>
              )}
            </button>
          </div>

          {/* Khối Công Cụ Phải: Detail Panel toggle, Controls toggle, Refresh & Settings */}
          <div className="flex items-center gap-1 pl-1 border-l border-border-subtle relative" ref={settingsMenuRef}>
            {/* Toggle ControlsBar / DevTools */}
            <button
              type="button"
              data-testid="toggle-controls"
              onClick={toggleControls}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 border border-border-subtle rounded-md text-xs cursor-pointer transition-colors",
                controlsOpen ? "bg-accent-subtle text-accent font-semibold" : "bg-surface text-secondary hover:text-primary hover:bg-surface-hover shadow-2xs"
              )}
              title="Bật/tắt thanh công cụ"
            >
              <SlidersHorizontal size={12} />
              {!isMobile && <span>Thanh công cụ</span>}
            </button>

            {/* Toggle Detail Panel */}
            {isHistoryActive && (
              <button
                type="button"
                data-testid="toggle-detail-panel"
                onClick={toggleDetailPanel}
                className={clsx(
                  "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer transition-colors shadow-2xs",
                  detailPanelOpen ? "bg-accent-subtle text-accent font-medium" : "bg-surface text-secondary hover:text-primary hover:bg-surface-hover"
                )}
                title="Bật/tắt chi tiết commit"
              >
                <PanelRight size={14} />
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center justify-center w-7 h-7 bg-surface border border-border-subtle rounded-md text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors shadow-2xs"
              title="Tải lại dữ liệu repo"
            >
              <RefreshCw size={12} />
            </button>

            {/* Settings dropdown trigger */}
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={clsx(
                "flex items-center justify-center w-7 h-7 border border-border-subtle rounded-md cursor-pointer transition-colors shadow-2xs",
                settingsOpen ? "bg-accent-subtle text-accent" : "bg-surface text-secondary hover:bg-surface-hover hover:text-primary"
              )}
              title="Cài đặt (Theme, Ngôn ngữ, Chế độ Git)"
            >
              <Settings size={13} />
            </button>

            {/* Settings Popover Dropdown */}
            {settingsOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-surface border border-border-subtle rounded-xl shadow-xl p-3 text-xs flex flex-col gap-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-bold text-primary border-b border-border-subtle pb-1.5 flex items-center justify-between">
                  <span>Cài đặt hệ thống</span>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="text-secondary hover:text-primary p-0.5"
                  >
                    ✕
                  </button>
                </div>

                {/* Theme options */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Giao diện</span>
                  <div className="grid grid-cols-3 gap-1 bg-window p-0.5 rounded-md border border-border-subtle">
                    {(["light", "dark", "system"] as Theme[]).map((tVal) => (
                      <button
                        key={tVal}
                        onClick={() => setTheme(tVal)}
                        className={clsx(
                          "px-1.5 py-1 rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors",
                          theme === tVal
                            ? "bg-surface text-primary shadow-xs font-bold"
                            : "text-secondary hover:text-primary"
                        )}
                        title={`Theme: ${tVal}`}
                      >
                        {tVal === "light" && <Sun size={11} />}
                        {tVal === "dark" && <Moon size={11} />}
                        {tVal === "system" && <Laptop size={11} />}
                        <span className="capitalize">{tVal}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locale options */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Ngôn ngữ</span>
                  <div className="grid grid-cols-2 gap-1 bg-window p-0.5 rounded-md border border-border-subtle">
                    {(["vi", "en"] as Locale[]).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocale(loc)}
                        className={clsx(
                          "px-2 py-1 rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors",
                          locale === loc
                            ? "bg-surface text-primary shadow-xs font-bold"
                            : "text-secondary hover:text-primary"
                        )}
                      >
                        <Languages size={11} />
                        <span>{loc === "vi" ? "Tiếng Việt" : "English"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode options */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Chế độ Git</span>
                  <button
                    onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-window hover:bg-surface-hover border border-border-subtle text-primary font-medium cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-accent" />
                      <span>{mode === "simple" ? "Chế độ Đơn giản" : "Chế độ Nâng cao"}</span>
                    </div>
                    <span className="text-[10px] text-accent font-bold uppercase">{mode}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <RemoteProgressBanner
        task={activeRemoteTask}
        onCancel={handleCancelTask}
      />
    </>
  );
};
