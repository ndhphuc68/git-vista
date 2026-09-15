import React from "react";
import clsx from "clsx";
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
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-2 h-48">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Đang đọc diff...</span>
      </div>
    );
  }

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="p-8 text-tertiary text-xs text-center">
        Không có thay đổi văn bản cho tệp này.
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono text-xs overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-2xs">
      {diff.hunks.map((hunk, hIdx) => (
        <div key={hIdx} className="border-b last:border-b-0 border-border-subtle">
          {/* Hunk Header */}
          <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
            <span className="text-accent font-mono">{hunk.header}</span>
          </div>

          {/* Hunk Lines */}
          <div className="divide-y divide-border-subtle/30">
            {hunk.lines.map((line, lIdx) => {
              const isAdd = line.line_type === "add";
              const isDel = line.line_type === "delete";

              return (
                <div
                  key={lIdx}
                  className={clsx(
                    "flex leading-5 whitespace-pre font-mono hover:brightness-95 dark:hover:brightness-110 transition-colors",
                    isAdd
                      ? "bg-diff-add-bg text-diff-add-text"
                      : isDel
                      ? "bg-diff-remove-bg text-diff-remove-text"
                      : "bg-transparent text-primary"
                  )}
                >
                  {/* Line numbers gutter */}
                  <div className="flex shrink-0 select-none border-r border-border-subtle/50 text-tertiary bg-window/40">
                    <span className="w-10 text-right pr-2 py-0.5 opacity-70">
                      {line.old_lineno ?? ""}
                    </span>
                    <span className="w-10 text-right pr-2 py-0.5 opacity-70">
                      {line.new_lineno ?? ""}
                    </span>
                  </div>

                  {/* Sign (+ / - / space) */}
                  <span
                    className={clsx(
                      "w-6 select-none text-center py-0.5 shrink-0 font-bold",
                      isAdd ? "text-diff-add-text" : isDel ? "text-diff-remove-text" : "text-tertiary"
                    )}
                  >
                    {isAdd ? "+" : isDel ? "-" : " "}
                  </span>

                  {/* Code line content */}
                  <span className="flex-1 min-w-0 py-0.5 pr-3 overflow-x-visible">
                    {line.content}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
