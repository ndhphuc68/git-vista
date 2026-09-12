import React, { useEffect } from "react";
import { User, Calendar, GitCommit, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";
import { FileDiffViewer } from "./FileDiffViewer";

export const CommitDetailPanel: React.FC = () => {
  const { currentRepo, selectedCommitId, selectedFilePath, setSelectedFile } = useRepoStore();

  const { data: details, isLoading } = useQuery({
    queryKey: ["commit-details", currentRepo?.path, selectedCommitId],
    queryFn: () => invokeCommand.getCommitDetails(currentRepo!.path, selectedCommitId!),
    enabled: Boolean(currentRepo && selectedCommitId),
  });

  useEffect(() => {
    const firstFile = details?.files[0];
    if (firstFile && !selectedFilePath) {
      setSelectedFile(firstFile.path);
    }
  }, [details, selectedFilePath, setSelectedFile]);

  if (!selectedCommitId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-tertiary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        Chọn một commit để xem chi tiết và diff
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>
        Đang tải thông tin commit...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-surface)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "var(--space-4)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", color: "var(--accent)" }}>
            <GitCommit size={14} />
            <span>{details.id}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
            <span style={{ color: "var(--diff-add-text)" }}>{`+${details.total_additions}`}</span>
            <span style={{ color: "var(--diff-remove-text)" }}>{`-${details.total_deletions}`}</span>
          </div>
        </div>

        <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
          {details.full_message}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={12} />
            <span>{details.author_name} &lt;{details.author_email}&gt;</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={12} />
            <span>{new Date(details.author_timestamp_sec * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "var(--space-2) var(--space-4)",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-window)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
        }}
      >
        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)" }}>
          CÁC TỆP THAY ĐỔI ({details.files.length})
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
          {details.files.map((file) => {
            const isSelected = selectedFilePath === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "var(--accent-subtle)" : "var(--bg-surface)",
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  fontSize: "var(--font-size-xs)",
                  cursor: "pointer",
                }}
              >
                <FileText size={11} />
                <span>{file.path}</span>
                <span style={{ color: "var(--diff-add-text)", fontSize: "10px" }}>{`+${file.additions}`}</span>
                <span style={{ color: "var(--diff-remove-text)", fontSize: "10px" }}>{`-${file.deletions}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: "var(--space-3)", overflowY: "auto" }}>
        {selectedFilePath && currentRepo && (
          <FileDiffViewer
            repoPath={currentRepo.path}
            commitId={selectedCommitId}
            filePath={selectedFilePath}
          />
        )}
      </div>
    </div>
  );
};
