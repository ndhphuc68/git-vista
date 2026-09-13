import React, { useState } from "react";
import { FolderGit2, FolderOpen, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRepo }) => {
  const [error, setError] = useState<string | null>(null);

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
      setError(err?.message || "Không thể mở repository. Vui lòng kiểm tra đường dẫn hợp lệ.");
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-window)",
        padding: "var(--space-6)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FolderGit2 size={48} color="var(--accent)" style={{ marginBottom: "var(--space-3)" }} />
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>Visual Git Client</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)", fontWeight: 600, textTransform: "uppercase" }}>
            <Clock size={13} />
            <span>Repository gần đây</span>
          </div>

          {isLoading ? (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>Đang tải...</p>
          ) : recents.length === 0 ? (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>Chưa có repository nào gần đây.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {recents.map((item) => (
                <button
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
                    textAlign: "left",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{item.name}</span>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{item.path}</span>
                  </div>
                  <ArrowRight size={14} color="var(--text-secondary)" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
