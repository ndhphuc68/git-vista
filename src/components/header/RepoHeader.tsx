import React, { useEffect } from "react";
import { FolderGit2, GitBranch, ArrowLeft, RefreshCw, History, FileDiff } from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useTranslation } from "../../i18n";
import { invokeCommand } from "../../ipc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface RepoHeaderProps {
  onBackToWelcome: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const { activeScreen, setActiveScreen } = useViewStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: repoStatus } = useQuery({
    queryKey: ["repoStatus", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo?.path),
  });

  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || "");
  const shortcutLabel1 = isMac ? "Cmd+1" : "Ctrl+1";
  const shortcutLabel2 = isMac ? "Cmd+2" : "Ctrl+2";

  useEffect(() => {
    if (!currentRepo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        setActiveScreen("history");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        setActiveScreen("changes");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentRepo, setActiveScreen]);

  if (!currentRepo) return null;

  const stagedCount = repoStatus?.staged?.length ?? 0;
  const unstagedCount = repoStatus?.unstaged?.length ?? 0;
  const untrackedCount = repoStatus?.untracked?.length ?? 0;
  const totalChanges = stagedCount + unstagedCount + untrackedCount;

  const isHistoryActive = activeScreen === "history";
  const isChangesActive = activeScreen === "changes";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-2) var(--space-4)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "44px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <button
          onClick={onBackToWelcome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
          title="Đổi repository"
        >
          <ArrowLeft size={13} />
          <span>Kho</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FolderGit2 size={16} color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{currentRepo.name}</span>
        </div>

        {currentRepo.head_branch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
            }}
          >
            <GitBranch size={12} />
            <span>{currentRepo.head_branch}</span>
          </div>
        )}
      </div>

      {/* Screen switcher tabs */}
      <div
        role="tablist"
        aria-label="Màn hình làm việc"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          backgroundColor: "var(--bg-window)",
          padding: "2px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
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
            gap: "6px",
            padding: "3px 10px",
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
          <span
            style={{
              fontSize: "10px",
              opacity: 0.7,
              marginLeft: "2px",
            }}
          >
            {shortcutLabel1}
          </span>
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
            gap: "6px",
            padding: "3px 10px",
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
          <span
            style={{
              fontSize: "10px",
              opacity: 0.7,
              marginLeft: "2px",
            }}
          >
            {shortcutLabel2}
          </span>
          {totalChanges > 0 && (
            <span
              data-testid="changes-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
                minWidth: "18px",
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

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button
          onClick={() => queryClient.invalidateQueries()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-xs)",
            cursor: "pointer",
          }}
          title="Tải lại dữ liệu repo"
        >
          <RefreshCw size={13} />
          <span>Làm mới</span>
        </button>
      </div>
    </header>
  );
};
