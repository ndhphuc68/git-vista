import React from "react";
import { FolderGit2, GitBranch, ArrowLeft, RefreshCw } from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { useQueryClient } from "@tanstack/react-query";

interface RepoHeaderProps {
  onBackToWelcome: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onBackToWelcome }) => {
  const { currentRepo } = useRepoStore();
  const queryClient = useQueryClient();

  if (!currentRepo) return null;

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
