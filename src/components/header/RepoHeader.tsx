import React, { useEffect } from "react";
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
} from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import { useTranslation } from "../../i18n";
import { invokeCommand } from "../../ipc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

  const isHistoryActive = activeScreen === "history";
  const isChangesActive = activeScreen === "changes";

  return (
    <header
      data-testid="repo-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-3)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "44px",
        minHeight: "44px",
        maxHeight: "44px",
        flexShrink: 0,
        gap: "var(--space-2)",
        overflow: "hidden",
      }}
    >
      {/* Left section: Sidebar toggle, Back, Repo info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <button
          type="button"
          data-testid="toggle-sidebar"
          onClick={toggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            backgroundColor: sidebarOpen ? "var(--accent-subtle)" : "transparent",
            color: sidebarOpen ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title={`Bật/tắt thanh bên (${shortcutSidebar})`}
        >
          <PanelLeft size={14} />
        </button>

        <button
          onClick={onBackToWelcome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 6px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="Đổi repository"
        >
          <ArrowLeft size={12} />
          {!isMobile && <span>Kho</span>}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
          }}
        >
          <FolderGit2 size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isMobile ? "100px" : "180px",
            }}
            title={currentRepo.name}
          >
            {currentRepo.name}
          </span>
        </div>

        {currentRepo.head_branch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isMobile ? "70px" : "130px",
              flexShrink: 1,
            }}
            title={`Branch: ${currentRepo.head_branch}`}
          >
            <GitBranch size={11} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentRepo.head_branch}
            </span>
          </div>
        )}
      </div>

      {/* Center section: Screen switcher tabs */}
      <div
        role="tablist"
        aria-label="Màn hình làm việc"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          backgroundColor: "var(--bg-window)",
          padding: "2px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={isHistoryActive}
          data-testid="tab-history"
          onClick={() => setActiveScreen("history")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            backgroundColor: isHistoryActive ? "var(--accent-subtle)" : "transparent",
            color: isHistoryActive ? "var(--text-primary)" : "var(--text-secondary)",
            border: isHistoryActive ? "1px solid var(--accent)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-xs)",
            fontWeight: isHistoryActive ? 600 : 500,
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-macos)",
          }}
          title={`History (${shortcutLabel1})`}
        >
          <History size={13} color={isHistoryActive ? "var(--accent)" : "currentColor"} />
          <span>{t.screens.history}</span>
          {!isMobile && (
            <span
              style={{
                fontSize: "10px",
                opacity: 0.7,
                marginLeft: "2px",
              }}
            >
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            backgroundColor: isChangesActive ? "var(--accent-subtle)" : "transparent",
            color: isChangesActive ? "var(--text-primary)" : "var(--text-secondary)",
            border: isChangesActive ? "1px solid var(--accent)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-xs)",
            fontWeight: isChangesActive ? 600 : 500,
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-macos)",
          }}
          title={`Changes (${shortcutLabel2})`}
        >
          <FileDiff size={13} color={isChangesActive ? "var(--accent)" : "currentColor"} />
          <span>{t.screens.changes}</span>
          {!isMobile && (
            <span
              style={{
                fontSize: "10px",
                opacity: 0.7,
                marginLeft: "2px",
              }}
            >
              {shortcutLabel2}
            </span>
          )}
          {totalChanges > 0 && (
            <span
              data-testid="changes-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                minWidth: "16px",
                height: "16px",
                borderRadius: "var(--radius-full)",
                fontSize: "10px",
                fontWeight: 600,
                backgroundColor: "var(--accent)",
                color: "var(--accent-contrast)",
                lineHeight: 1,
              }}
            >
              {totalChanges}
            </span>
          )}
        </button>
      </div>

      {/* Right section: ControlsBar toggle, DetailPanel toggle, Refresh */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-testid="toggle-controls"
          onClick={toggleControls}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 6px",
            backgroundColor: controlsOpen ? "var(--accent-subtle)" : "transparent",
            color: controlsOpen ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              backgroundColor: detailPanelOpen ? "var(--accent-subtle)" : "transparent",
              color: detailPanelOpen ? "var(--accent)" : "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
            title="Bật/tắt chi tiết commit"
          >
            <PanelRight size={14} />
          </button>
        )}

        <button
          onClick={() => queryClient.invalidateQueries()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 6px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
          title="Tải lại dữ liệu repo"
        >
          <RefreshCw size={12} />
          {!isMobile && <span>Làm mới</span>}
        </button>
      </div>
    </header>
  );
};
