import React from "react";
import clsx from "clsx";
import { useFormatDate, useTranslation } from "../../i18n";
import { AuthorAvatar } from "../../features/history";
import { getChangeTypeBadgeClass } from "./fileHistoryChangeTypeBadge";
import type { FileHistoryItem } from "../../ipc/bindings.generated";
import { CHANGE_TYPE } from "../../domain/enums";

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
  const formatDate = useFormatDate();

  const changeTypeBadge = getChangeTypeBadgeClass(commit.change_type);
  const changeTypeTitle =
    commit.change_type === CHANGE_TYPE.ADDED
      ? t.inspector.changeTypeAdded
      : commit.change_type === CHANGE_TYPE.DELETED
        ? t.inspector.changeTypeDeleted
        : t.inspector.changeTypeModified;

  return (
    <button
      type="button"
      onClick={() => onSelect(commit.commit_id)}
      className={clsx(
        "group flex w-full cursor-pointer flex-col gap-1 rounded-md border p-2 text-left text-xs transition-colors",
        isSelected
          ? "border-accent bg-accent-subtle font-semibold text-primary shadow-2xs ring-1 ring-accent/30"
          : "border-border-subtle bg-surface font-normal text-primary hover:bg-surface-hover"
      )}
    >
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
          {formatDate(commit.timestamp_sec)}
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
