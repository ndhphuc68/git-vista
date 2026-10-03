import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";
import { AuthorAvatar, formatRelativeTime } from "../../features/history";
import { getChangeTypeBadgeClass } from "./fileHistoryChangeTypeBadge";
import type { FileHistoryItem } from "../../ipc/bindings.generated";

interface FileHistoryCommitRowProps {
  commit: FileHistoryItem;
  isSelected: boolean;
  onSelect: (commitId: string) => void;
}

/** One commit entry in FileHistoryView's left-pane list. */
export const FileHistoryCommitRow: React.FC<FileHistoryCommitRowProps> = ({
  commit,
  isSelected,
  onSelect,
}) => {
  const { t } = useTranslation();

  const changeTypeBadge = getChangeTypeBadgeClass(commit.change_type);
  const changeTypeTitle =
    commit.change_type === "added"
      ? t.inspector.changeTypeAdded
      : commit.change_type === "deleted"
        ? t.inspector.changeTypeDeleted
        : t.inspector.changeTypeModified;

  return (
    <button
      type="button"
      onClick={() => onSelect(commit.commit_id)}
      className={clsx(
        "group flex flex-col p-2 rounded-md text-xs cursor-pointer transition-all text-left w-full border relative gap-1",
        isSelected
          ? "bg-accent-subtle/80 border-accent/80 text-primary font-semibold shadow-2xs ring-1 ring-accent/30"
          : "bg-surface border-border-subtle hover:bg-surface-hover text-primary font-normal"
      )}
    >
      {/* Left Active Indicator Bar */}
      {isSelected && <div className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r" />}

      {/* Top row: Change badge, Short SHA, Date */}
      <div className="flex items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={clsx(
              "px-1 py-0.2 rounded text-[9px] font-mono font-bold uppercase border shrink-0",
              changeTypeBadge
            )}
            title={changeTypeTitle}
          >
            {commit.change_type.slice(0, 1)}
          </span>
          <span className="font-mono text-[10px] text-accent font-bold truncate">
            {commit.short_id}
          </span>
        </div>

        <span className="text-[10px] text-tertiary font-mono shrink-0">
          {formatRelativeTime(commit.timestamp_sec)}
        </span>
      </div>

      {/* Summary */}
      <div className="text-xs text-primary line-clamp-2 leading-snug">
        {commit.summary || "No commit message"}
      </div>

      {/* Author */}
      <div className="flex items-center gap-1.5 text-[10px] text-secondary mt-0.5">
        <AuthorAvatar
          name={commit.author_name}
          email={commit.author_email}
          size={14}
          className="text-[8px]"
        />
        <span className="truncate">{commit.author_name}</span>
      </div>
    </button>
  );
};
