import React from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";

interface FileDiffViewerProps {
  repoPath: string;
  commitId: string;
  filePath: string;
}

export const FileDiffViewer: React.FC<FileDiffViewerProps> = ({ repoPath, commitId, filePath }) => {
  const { data: diff, isLoading } = useQuery({
    queryKey: ["file-diff", repoPath, commitId, filePath],
    queryFn: () => invokeCommand.getCommitFileDiff(repoPath, commitId, filePath),
  });

  if (isLoading) {
    return <div style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>Đang đọc diff...</div>;
  }

  if (!diff || diff.hunks.length === 0) {
    return <div style={{ padding: "var(--space-3)", color: "var(--text-tertiary)", fontSize: "var(--font-size-xs)" }}>Không có thay đổi văn bản cho file này.</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        overflowX: "auto",
      }}
    >
      {diff.hunks.map((hunk, hIdx) => (
        <div key={hIdx} style={{ marginBottom: "var(--space-2)" }}>
          <div
            style={{
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {hunk.header}
          </div>

          {hunk.lines.map((line, lIdx) => {
            const isAdd = line.line_type === "add";
            const isDel = line.line_type === "delete";

            return (
              <div
                key={lIdx}
                style={{
                  display: "flex",
                  backgroundColor: isAdd
                    ? "var(--diff-add-bg)"
                    : isDel
                    ? "var(--diff-remove-bg)"
                    : "transparent",
                  color: isAdd
                    ? "var(--diff-add-text)"
                    : isDel
                    ? "var(--diff-remove-text)"
                    : "var(--text-primary)",
                  padding: "1px 4px",
                  lineHeight: "18px",
                  whiteSpace: "pre",
                }}
              >
                <span
                  style={{
                    width: "36px",
                    color: "var(--text-tertiary)",
                    userSelect: "none",
                    textAlign: "right",
                    paddingRight: "8px",
                  }}
                >
                  {line.old_lineno ?? ""}
                </span>
                <span
                  style={{
                    width: "36px",
                    color: "var(--text-tertiary)",
                    userSelect: "none",
                    textAlign: "right",
                    paddingRight: "8px",
                  }}
                >
                  {line.new_lineno ?? ""}
                </span>
                <span style={{ width: "16px", userSelect: "none", textAlign: "center" }}>
                  {isAdd ? "+" : isDel ? "-" : " "}
                </span>
                <span>{line.content}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
