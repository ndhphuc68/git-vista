import React, { useState } from "react";
import clsx from "clsx";
import { GitCommit, AlertCircle, RefreshCw } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";

export interface CommitBoxProps {
  repoPath: string;
  stagedCount: number;
  lastCommitMessage?: string;
  onCommit?: (summary: string, description?: string, amend?: boolean) => Promise<void>;
  onSuccess?: () => void;
  isLoading?: boolean;
}

export const CommitBox: React.FC<CommitBoxProps> = ({
  repoPath,
  stagedCount,
  lastCommitMessage,
  onCommit,
  onSuccess,
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
      if (onCommit) {
        await onCommit(
          summary.trim(),
          description.trim() ? description.trim() : undefined,
          isAmend
        );
      } else {
        await invokeCommand.createCommit(
          repoPath,
          summary.trim(),
          description.trim() ? description.trim() : undefined,
          isAmend
        );
      }

      useToastStore.getState().showToast({
        message: isAmend ? "Đã sửa commit (Amend)" : "Đã tạo commit",
        type: "success",
        durationMs: 10000,
        undoAction: async () => {
          await invokeCommand.undoCommit(repoPath);
        },
      });

      setSummary("");
      setDescription("");
      setIsAmend(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
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
    <div className="flex flex-col gap-2 p-3 bg-surface border-t border-border-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitCommit size={14} className="text-accent" />
          <span className="text-xs font-semibold text-secondary">
            COMMIT
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              "text-[11px] font-mono",
              isOver72 ? "text-diff-remove-text font-semibold" : "text-secondary font-normal"
            )}
          >
            {summary.length}/72
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="text"
          data-testid="commit-summary-input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tiêu đề commit (ngắn gọn, dưới 72 ký tự)..."
          className={clsx(
            "w-full px-2 py-1.5 bg-window rounded-sm text-xs text-primary outline-none box-border transition-colors",
            isOver72 ? "border border-diff-remove-text focus:border-diff-remove-text" : "border border-border-subtle focus:border-accent"
          )}
        />

        {isOver72 && (
          <div className="flex items-center gap-1 text-diff-remove-text text-[10px] mt-0.5">
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
        className="w-full px-2 py-1.5 bg-window border border-border-subtle focus:border-accent rounded-sm text-xs text-primary resize-y outline-none font-inherit box-border transition-colors"
      />

      <div className="flex items-center justify-between mt-0.5">
        <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer select-none">
          <input
            type="checkbox"
            data-testid="amend-checkbox"
            checked={isAmend}
            onChange={handleAmendToggle}
            className="cursor-pointer"
          />
          <span>Amend (Sửa commit gần nhất)</span>
        </label>

        <span className="text-[10px] text-tertiary">
          {shortcutHint}
        </span>
      </div>

      <button
        type="button"
        data-testid="commit-button"
        disabled={!canCommit}
        onClick={handleSubmit}
        className={clsx(
          "flex items-center justify-center gap-1.5 w-full py-2 px-3 border rounded-sm text-xs font-semibold transition-all duration-150 ease-macos",
          canCommit
            ? "bg-accent text-accent-contrast border-accent cursor-pointer hover:bg-accent-hover active:scale-[0.99]"
            : "bg-window text-tertiary border-border-subtle cursor-not-allowed"
        )}
      >
        {submitting || isLoading ? (
          <>
            <RefreshCw size={13} className="animate-spin" />
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
