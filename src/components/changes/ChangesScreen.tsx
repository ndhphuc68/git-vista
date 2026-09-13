import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";
import { StagingFileList, SelectedWorkingFile } from "./StagingFileList";
import { CommitBox } from "./CommitBox";
import { InteractiveDiffViewer } from "./InteractiveDiffViewer";

export const ChangesScreen: React.FC = () => {
  const { currentRepo } = useRepoStore();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<SelectedWorkingFile | null>(null);

  const { data: status } = useQuery({
    queryKey: ["repoStatus", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo?.path),
  });

  // Auto-select first available file if none is selected or previous file disappeared
  useEffect(() => {
    if (!status) return;

    const allFiles: SelectedWorkingFile[] = [
      ...status.staged.map((f) => ({ path: f.path, is_staged: true })),
      ...status.unstaged.map((f) => ({ path: f.path, is_staged: false })),
      ...status.untracked.map((f) => ({ path: f.path, is_staged: false })),
    ];

    if (allFiles.length === 0) {
      setSelectedFile(null);
      return;
    }

    const stillExists = selectedFile && allFiles.some((f) => f.path === selectedFile.path && f.is_staged === selectedFile.is_staged);
    if (!stillExists) {
      const first = allFiles[0];
      if (first) {
        setSelectedFile(first);
      }
    }
  }, [status, selectedFile]);

  if (!currentRepo) {
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
        Chưa mở kho mã nguồn
      </div>
    );
  }

  const stagedCount = status?.staged?.length ?? 0;

  const handleStageFile = async (filePath: string) => {
    await invokeCommand.stageFile(currentRepo.path, filePath);
    setSelectedFile({ path: filePath, is_staged: true });
    await queryClient.invalidateQueries();
  };

  const handleUnstageFile = async (filePath: string) => {
    await invokeCommand.unstageFile(currentRepo.path, filePath);
    setSelectedFile({ path: filePath, is_staged: false });
    await queryClient.invalidateQueries();
  };

  const handleStageAll = async () => {
    await invokeCommand.stageAll(currentRepo.path);
    await queryClient.invalidateQueries();
  };

  const handleUnstageAll = async () => {
    await invokeCommand.unstageAll(currentRepo.path);
    await queryClient.invalidateQueries();
  };

  const handleDiscardFile = async (filePath: string) => {
    await invokeCommand.discardFileChanges(currentRepo.path, filePath);
    await queryClient.invalidateQueries();
  };

  const handleStageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return;
    await invokeCommand.stageHunk(currentRepo.path, selectedFile.path, hunkIndex, false);
    await queryClient.invalidateQueries();
  };

  const handleUnstageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return;
    await invokeCommand.stageHunk(currentRepo.path, selectedFile.path, hunkIndex, true);
    await queryClient.invalidateQueries();
  };

  const handleStageLines = async (hunkIndex: number, lineIndices: number[]) => {
    if (!selectedFile) return;
    await invokeCommand.stageLines(currentRepo.path, selectedFile.path, hunkIndex, lineIndices, false);
    await queryClient.invalidateQueries();
  };

  const handleUnstageLines = async (hunkIndex: number, lineIndices: number[]) => {
    if (!selectedFile) return;
    await invokeCommand.stageLines(currentRepo.path, selectedFile.path, hunkIndex, lineIndices, true);
    await queryClient.invalidateQueries();
  };

  const handleCommit = async (summary: string, description?: string, amend?: boolean) => {
    await invokeCommand.createCommit(currentRepo.path, summary, description, amend);
    await queryClient.invalidateQueries();
  };

  return (
    <main
      style={{
        display: "flex",
        height: "calc(100vh - 76px)",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Left Sidebar: Staging File List + Commit Box */}
      <section
        aria-label="Danh sách thay đổi và lưu commit"
        style={{
          width: "320px",
          minWidth: "280px",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRight: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <StagingFileList
            repoPath={currentRepo.path}
            status={status || { staged: [], unstaged: [], untracked: [] }}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
            onStageAll={handleStageAll}
            onUnstageAll={handleUnstageAll}
            onDiscardFile={handleDiscardFile}
          />
        </div>

        <div style={{ flexShrink: 0 }}>
          <CommitBox
            repoPath={currentRepo.path}
            stagedCount={stagedCount}
            onCommit={handleCommit}
          />
        </div>
      </section>

      {/* Right Area: Interactive Diff Viewer */}
      <section
        aria-label="Xem chi tiết thay đổi diff"
        style={{
          flex: 1,
          height: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {selectedFile ? (
          <InteractiveDiffViewer
            repoPath={currentRepo.path}
            filePath={selectedFile.path}
            isStaged={selectedFile.is_staged}
            onStageHunk={handleStageHunk}
            onUnstageHunk={handleUnstageHunk}
            onStageLines={handleStageLines}
            onUnstageLines={handleUnstageLines}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
              color: "var(--text-tertiary)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            <FileText size={36} color="var(--text-tertiary)" />
            <span>Chọn một file từ danh sách bên trái để xem diff và đánh dấu thay đổi.</span>
          </div>
        )}
      </section>
    </main>
  );
};
