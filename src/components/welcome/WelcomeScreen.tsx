import React, { useState } from "react";
import {
  FolderGit2,
  FolderOpen,
  Clock,
  ArrowRight,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRepo,
}) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: recents = [], isLoading } = useQuery({
    queryKey: ["recent-repos"],
    queryFn: () => invokeCommand.getRecentRepos(),
  });

  const handleOpenFolder = async () => {
    try {
      setError(null);
      const path = await invokeCommand.selectRepoFolder();
      if (path) {
        const summary = await invokeCommand.openRepository(path);
        onSelectRepo(summary);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Không thể mở repository. Vui lòng kiểm tra đường dẫn hợp lệ."
      );
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      setError(null);
      const summary = await invokeCommand.openRepository(path);
      onSelectRepo(summary);
    } catch (err: any) {
      setError(err?.message || `Không thể mở repository tại: ${path}`);
    }
  };

  const handleClearRecents = async () => {
    try {
      await invokeCommand.clearRecentRepos();
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Lỗi khi xoá danh sách gần đây:", err);
    }
  };

  const handleRemoveRecent = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await invokeCommand.removeRecentRepo(path);
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Lỗi khi xoá repo:", err);
    }
  };

  return (
    <div
      data-testid="welcome-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-window)",
        overflowY: "auto",
        padding: "var(--space-6) var(--space-4)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          margin: "auto 0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FolderGit2
            size={48}
            color="var(--accent)"
            style={{ marginBottom: "var(--space-3)" }}
          />
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
            Visual Git Client
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-sm)",
              marginTop: "4px",
            }}
          >
            Trực quan hoá lịch sử Git nhanh và mượt mà
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "var(--space-3) var(--space-4)",
              backgroundColor: "var(--diff-del-bg)",
              color: "var(--diff-del-text)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              border: "1px solid var(--diff-del-border)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <AlertCircle size={16} className="shrink-0" />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Đóng thông báo"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--diff-del-text)",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={handleOpenFolder}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--accent)",
            color: "var(--accent-contrast)",
            borderRadius: "var(--radius-lg)",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            border: "none",
            boxShadow: "var(--shadow-md)",
            minHeight: "40px",
          }}
        >
          <FolderOpen size={18} />
          <span>Mở thư mục...</span>
        </button>

        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={13} />
              <span>
                Repository gần đây {recents.length > 0 && `(${recents.length})`}
              </span>
            </div>

            {recents.length > 0 && (
              <button
                type="button"
                data-testid="clear-recents-btn"
                onClick={handleClearRecents}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--text-tertiary)",
                  fontSize: "11px",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  transition: "color var(--duration-fast) var(--ease-macos)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-tertiary)")
                }
                title="Xoá toàn bộ lịch sử repository gần đây"
              >
                <Trash2 size={11} />
                <span>Dọn dẹp</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              Đang tải...
            </p>
          ) : recents.length === 0 ? (
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              Chưa có repository nào gần đây.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-1)",
                maxHeight: "260px",
                overflowY: "auto",
                paddingRight: "2px",
              }}
            >
              {recents.map((item) => (
                <div
                  key={item.path}
                  onClick={() => handleOpenRecent(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) var(--space-3)",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--bg-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--font-size-sm)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--text-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.path}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      data-testid={`remove-recent-${item.path}`}
                      onClick={(e) => handleRemoveRecent(e, item.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        borderRadius: "var(--radius-sm)",
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        cursor: "pointer",
                        opacity: 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.color = "var(--diff-remove-text)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.6";
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
                      title="Xoá repo này khỏi danh sách"
                    >
                      <X size={12} />
                    </button>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
