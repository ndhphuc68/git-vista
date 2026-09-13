import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus, FileCode, AlertTriangle, Layers } from "lucide-react";
import { invokeCommand } from "../../ipc/client";

export interface InteractiveDiffViewerProps {
  repoPath: string;
  filePath: string;
  isStaged: boolean;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

export const InteractiveDiffViewer: React.FC<InteractiveDiffViewerProps> = ({
  repoPath,
  filePath,
  isStaged,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => {
  const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);

  const { data: diff, isLoading, isError } = useQuery({
    queryKey: ["workingFileDiff", repoPath, filePath, isStaged],
    queryFn: () => invokeCommand.getWorkingFileDiff(repoPath, filePath, isStaged),
    enabled: Boolean(repoPath && filePath),
  });

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        Đang đọc diff...
      </div>
    );
  }

  if (isError || !diff) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "8px",
          color: "var(--text-tertiary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        <AlertTriangle size={18} color="var(--diff-remove-text)" />
        <span>Không thể đọc diff cho tệp này.</span>
      </div>
    );
  }

  const isBinary = diff.status?.toLowerCase() === "binary";

  if (isBinary) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "8px",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        <FileCode size={24} color="var(--text-tertiary)" />
        <span>Tệp nhị phân - không thể hiển thị diff</span>
      </div>
    );
  }

  if (diff.hunks.length === 0) {
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
        Không có thay đổi nội dung
      </div>
    );
  }

  const totalAdds = diff.additions;
  const totalDels = diff.deletions;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-surface)",
        overflow: "auto",
      }}
    >
      {/* File Diff Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          backgroundColor: "var(--bg-window)",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: isStaged ? "var(--accent-subtle)" : "var(--bg-surface)",
              color: isStaged ? "var(--accent)" : "var(--text-secondary)",
              border: isStaged ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
              fontSize: "10px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {isStaged ? "STAGED" : "UNSTAGED"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={diff.file_path}
          >
            {diff.file_path}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "var(--font-size-xs)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
            <span style={{ color: "var(--diff-add-text)" }}>+{totalAdds}</span>
            <span style={{ color: "var(--diff-remove-text)" }}>-{totalDels}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
            <Layers size={13} />
            <span>{diff.hunks.length} {diff.hunks.length === 1 ? "hunk" : "hunks"}</span>
          </div>
        </div>
      </div>

      {/* Hunks list */}
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
          <div key={`hunk-${hIdx}`} style={{ marginBottom: "16px" }}>
            {/* Hunk Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                borderTop: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span>{hunk.header}</span>

              {isStaged ? (
                <button
                  type="button"
                  data-testid={`unstage-hunk-${hIdx}`}
                  onClick={() => onUnstageHunk(hIdx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  title="Bỏ đánh dấu đoạn này (Unstage Hunk)"
                >
                  <Minus size={11} />
                  <span>Unstage Hunk</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid={`stage-hunk-${hIdx}`}
                  onClick={() => onStageHunk(hIdx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    backgroundColor: "var(--accent)",
                    border: "1px solid var(--accent)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--accent-contrast)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Đánh dấu đoạn này (Stage Hunk)"
                >
                  <Plus size={11} />
                  <span>Stage Hunk</span>
                </button>
              )}
            </div>

            {/* Hunk Lines */}
            {hunk.lines.map((line, lIdx) => {
              const isAdd = line.line_type === "add";
              const isDel = line.line_type === "delete";
              const isModifiedLine = isAdd || isDel;
              const lineKey = `${hIdx}-${lIdx}`;
              const isHovered = hoveredLineKey === lineKey;

              return (
                <div
                  key={lineKey}
                  onMouseEnter={() => setHoveredLineKey(lineKey)}
                  onMouseLeave={() => setHoveredLineKey(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
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
                    padding: "1px 0",
                    lineHeight: "20px",
                    whiteSpace: "pre",
                    minWidth: "max-content",
                    width: "100%",
                  }}
                >
                  {/* Sticky Line Number Gutter */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      backgroundColor: isAdd
                        ? "var(--diff-add-bg)"
                        : isDel
                        ? "var(--diff-remove-bg)"
                        : "var(--bg-surface)",
                      flexShrink: 0,
                    }}
                  >
                    {/* Old Line Number */}
                    <span
                      style={{
                        width: "44px",
                        color: "var(--text-tertiary)",
                        userSelect: "none",
                        textAlign: "right",
                        paddingRight: "8px",
                        flexShrink: 0,
                      }}
                    >
                      {line.old_lineno ?? ""}
                    </span>

                    {/* New Line Number */}
                    <span
                      style={{
                        width: "44px",
                        color: "var(--text-tertiary)",
                        userSelect: "none",
                        textAlign: "right",
                        paddingRight: "8px",
                        flexShrink: 0,
                      }}
                    >
                      {line.new_lineno ?? ""}
                    </span>

                    {/* Origin Sign (+, -, ' ') */}
                    <span
                      style={{
                        width: "20px",
                        userSelect: "none",
                        textAlign: "center",
                        fontWeight: isModifiedLine ? 700 : 400,
                        flexShrink: 0,
                      }}
                    >
                      {isAdd ? "+" : isDel ? "-" : " "}
                    </span>
                  </div>

                  {/* Line Content */}
                  <span style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>{line.content}</span>

                  {/* Line-level Staging Action Button */}
                  {isModifiedLine && (
                    <div
                      style={{
                        padding: "0 8px",
                        opacity: isHovered ? 1 : 0.4,
                        transition: "opacity var(--duration-fast) var(--ease-macos)",
                        flexShrink: 0,
                      }}
                    >
                      {isStaged ? (
                        <button
                          type="button"
                          data-testid={`unstage-line-${hIdx}-${lIdx}`}
                          onClick={() => onUnstageLines(hIdx, [lIdx])}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            padding: "1px 6px",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-secondary)",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                          title="Bỏ đánh dấu dòng này"
                        >
                          <Minus size={10} />
                          <span>Line</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`stage-line-${hIdx}-${lIdx}`}
                          onClick={() => onStageLines(hIdx, [lIdx])}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            padding: "1px 6px",
                            backgroundColor: "var(--accent)",
                            border: "1px solid var(--accent)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--accent-contrast)",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                          title="Đánh dấu dòng này"
                        >
                          <Plus size={10} />
                          <span>Line</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
