import React, { useState } from "react";
import { GitCommit, AlertCircle, RefreshCw } from "lucide-react";

export interface CommitBoxProps {
  repoPath: string;
  stagedCount: number;
  lastCommitMessage?: string;
  onCommit: (summary: string, description?: string, amend?: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const CommitBox: React.FC<CommitBoxProps> = ({
  stagedCount,
  lastCommitMessage,
  onCommit,
  isLoading = false,
}) => {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [isAmend, setIsAmend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || "");
  const shortcutHint = isMac ? "Cmd+Enter" : "Ctrl+Enter";

  const isOver72 = summary.length > 72;
  const canCommit =
    summary.trim().length > 0 &&
    (isAmend || stagedCount > 0) &&
    !isLoading &&
    !submitting;

  const handleAmendToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAmend(checked);

    if (checked && lastCommitMessage && summary.trim() === "") {
      const parts = lastCommitMessage.split("\n\n");
      const firstLine = parts[0] ? parts[0].trim() : "";
      const remaining = parts.slice(1).join("\n\n").trim();
      setSummary(firstLine);
      setDescription(remaining);
    }
  };

  const handleSubmit = async () => {
    if (!canCommit) return;

    try {
      setSubmitting(true);
      await onCommit(
        summary.trim(),
        description.trim() ? description.trim() : undefined,
        isAmend
      );
      setSummary("");
      setDescription("");
      setIsAmend(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3)",
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <GitCommit size={14} color="var(--accent)" />
          <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)" }}>
            COMMIT
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: isOver72 ? "var(--diff-remove-text)" : "var(--text-secondary)",
              fontWeight: isOver72 ? 600 : 400,
            }}
          >
            {summary.length}/72
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <input
          type="text"
          data-testid="commit-summary-input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tiêu đề commit (ngắn gọn, dưới 72 ký tự)..."
          style={{
            width: "100%",
            padding: "6px 8px",
            backgroundColor: "var(--bg-window)",
            border: isOver72 ? "1px solid var(--diff-remove-text)" : "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-xs)",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {isOver72 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--diff-remove-text)",
              fontSize: "10px",
              marginTop: "2px",
            }}
          >
            <AlertCircle size={11} />
            <span>Vượt quá 72 ký tự khuyến nghị</span>
          </div>
        )}
      </div>

      <textarea
        data-testid="commit-description-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Mô tả chi tiết (tuỳ chọn)..."
        rows={3}
        style={{
          width: "100%",
          padding: "6px 8px",
          backgroundColor: "var(--bg-window)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--font-size-xs)",
          color: "var(--text-primary)",
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "var(--font-size-xs)",
            color: "var(--text-primary)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            data-testid="amend-checkbox"
            checked={isAmend}
            onChange={handleAmendToggle}
            style={{ cursor: "pointer" }}
          />
          <span>Amend (Sửa commit gần nhất)</span>
        </label>

        <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
          {shortcutHint}
        </span>
      </div>

      <button
        type="button"
        data-testid="commit-button"
        disabled={!canCommit}
        onClick={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          width: "100%",
          padding: "7px 12px",
          backgroundColor: canCommit ? "var(--accent)" : "var(--bg-window)",
          color: canCommit ? "var(--accent-contrast)" : "var(--text-tertiary)",
          border: "1px solid",
          borderColor: canCommit ? "var(--accent)" : "var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--font-size-xs)",
          fontWeight: 600,
          cursor: canCommit ? "pointer" : "not-allowed",
          transition: "all var(--duration-fast) var(--ease-macos)",
        }}
      >
        {submitting || isLoading ? (
          <>
            <RefreshCw size={13} className="spin" />
            <span>Đang lưu...</span>
          </>
        ) : isAmend ? (
          <span>Amend Commit</span>
        ) : (
          <span>Commit ({stagedCount} files)</span>
        )}
      </button>
    </div>
  );
};
