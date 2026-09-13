import React, { useEffect } from "react";
import clsx from "clsx";
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
      <div className="flex items-center justify-center h-full text-tertiary text-xs">
        Chọn một commit để xem chi tiết và diff
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div className="p-4 text-secondary text-xs">
        Đang tải thông tin commit...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-y-auto">
      <div className="p-4 border-b border-border-subtle flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-xs text-accent">
            <GitCommit size={14} />
            <span>{details.id}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-diff-add-text">{`+${details.total_additions}`}</span>
            <span className="text-diff-remove-text">{`-${details.total_deletions}`}</span>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-primary whitespace-pre-wrap">
          {details.full_message}
        </h3>

        <div className="flex items-center gap-3 text-secondary text-xs">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{details.author_name} &lt;{details.author_email}&gt;</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(details.author_timestamp_sec * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border-subtle bg-window flex flex-col gap-1">
        <span className="text-xs font-semibold text-secondary">
          CÁC TỆP THAY ĐỔI ({details.files.length})
        </span>
        <div className="flex flex-wrap gap-1">
          {details.files.map((file) => {
            const isSelected = selectedFilePath === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs cursor-pointer transition-colors",
                  isSelected
                    ? "border border-accent bg-accent-subtle text-accent font-medium shadow-sm"
                    : "border border-border-subtle bg-surface text-primary hover:bg-surface-hover"
                )}
              >
                <FileText size={11} className="shrink-0" />
                <span className="truncate max-w-[200px]">{file.path}</span>
                <span className="text-diff-add-text font-mono text-[10px]">{`+${file.additions}`}</span>
                <span className="text-diff-remove-text font-mono text-[10px]">{`-${file.deletions}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
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
