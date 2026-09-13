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
    return <div className="p-3 text-secondary text-xs">Đang đọc diff...</div>;
  }

  if (!diff || diff.hunks.length === 0) {
    return <div className="p-3 text-tertiary text-xs">Không có thay đổi văn bản cho file này.</div>;
  }

  return (
    <div className="flex flex-col font-mono text-xs overflow-x-auto">
      {diff.hunks.map((hunk, hIdx) => (
        <div key={hIdx} className="mb-2 rounded-sm overflow-hidden border border-border-subtle">
          <div className="bg-accent-subtle text-accent px-2 py-0.5 text-xs font-semibold">
            {hunk.header}
          </div>

          {hunk.lines.map((line, lIdx) => {
            const isAdd = line.line_type === "add";
            const isDel = line.line_type === "delete";

            return (
              <div
                key={lIdx}
                className={clsx(
                  "flex px-1 py-0.5 leading-5 whitespace-pre",
                  isAdd
                    ? "bg-diff-add-bg text-diff-add-text"
                    : isDel
                    ? "bg-diff-remove-bg text-diff-remove-text"
                    : "bg-transparent text-primary"
                )}
              >
                <span className="w-9 text-tertiary select-none text-right pr-2 shrink-0">
                  {line.old_lineno ?? ""}
                </span>
                <span className="w-9 text-tertiary select-none text-right pr-2 shrink-0">
                  {line.new_lineno ?? ""}
                </span>
                <span className="w-4 select-none text-center shrink-0">
                  {isAdd ? "+" : isDel ? "-" : " "}
                </span>
                <span className="flex-1 min-w-0">{line.content}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
