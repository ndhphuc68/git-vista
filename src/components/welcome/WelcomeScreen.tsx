import React, { useState } from "react";
import {
  FolderGit2,
  FolderOpen,
  Download,
  Clock,
  ArrowRight,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";
import { CloneModal } from "./CloneModal";

interface WelcomeScreenProps {
  onSelectRepo: (repo: RepoSummary) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRepo,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: recents = [], isLoading } = useQuery({
    queryKey: ["recent-repos"],
    queryFn: () => invokeCommand.getRecentRepos(),
  });

  const handleOpenFolder = async () => {
    try {
      setError(null);
      const path = await invokeCommand.selectRepoFolder();
      if (path) {
        const summary = await invokeCommand.openRepository(path);
        onSelectRepo(summary);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Không thể mở repository. Vui lòng kiểm tra đường dẫn hợp lệ."
      );
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      setError(null);
      const summary = await invokeCommand.openRepository(path);
      onSelectRepo(summary);
    } catch (err: any) {
      setError(err?.message || `Không thể mở repository tại: ${path}`);
    }
  };

  const handleClearRecents = async () => {
    try {
      await invokeCommand.clearRecentRepos();
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Lỗi khi xoá danh sách gần đây:", err);
    }
  };

  const handleRemoveRecent = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await invokeCommand.removeRecentRepo(path);
      await queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
    } catch (err) {
      console.warn("Lỗi khi xoá repo:", err);
    }
  };

  return (
    <div
      data-testid="welcome-screen"
      className="flex flex-col items-center h-full w-full bg-window overflow-y-auto px-4 py-6"
    >
      <div className="w-full max-w-145 flex flex-col gap-5 my-auto">
        <div className="text-center">
          <FolderGit2
            size={48}
            className="text-accent mb-3 mx-auto"
          />
          <h1 className="text-xl font-bold">
            Visual Git Client
          </h1>
          <p className="text-secondary text-xs mt-1">
            Trực quan hoá lịch sử Git nhanh và mượt mà
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="px-4 py-3 bg-diff-remove-bg text-diff-remove-text rounded-md text-[11px] border border-diff-remove-border flex items-center gap-2"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Đóng thông báo"
              className="bg-transparent border-0 cursor-pointer text-diff-remove-text font-bold text-sm"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleOpenFolder}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-contrast rounded-lg font-semibold text-xs cursor-pointer border-0 shadow-md min-h-[40px] hover:bg-accent-hover active:scale-[0.99] transition-all"
          >
            <FolderOpen size={18} />
            <span>Mở thư mục...</span>
          </button>

          <button
            type="button"
            data-testid="welcome-clone-btn"
            onClick={() => setIsCloneOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-surface-hover text-primary border border-border-subtle rounded-lg font-semibold text-xs cursor-pointer shadow-sm min-h-[40px] active:scale-[0.99] transition-all"
          >
            <Download size={18} className="text-accent" />
            <span>Clone kho chứa...</span>
          </button>
        </div>

        <div className="bg-surface border border-border-subtle rounded-lg p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between text-secondary text-xs font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>
                Repository gần đây {recents.length > 0 && `(${recents.length})`}
              </span>
            </div>

            {recents.length > 0 && (
              <button
                type="button"
                data-testid="clear-recents-btn"
                onClick={handleClearRecents}
                className="flex items-center gap-1 text-tertiary text-xs cursor-pointer bg-transparent border-0 px-1.5 py-0.5 rounded-sm hover:text-primary transition-colors"
                title="Xoá toàn bộ lịch sử repository gần đây"
              >
                <Trash2 size={11} />
                <span>Dọn dẹp</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <p className="text-[11px] text-tertiary">
              Đang tải...
            </p>
          ) : recents.length === 0 ? (
            <p className="text-[11px] text-tertiary">
              Chưa có repository nào gần đây.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-0.5">
              {recents.map((item) => (
                <div
                  key={item.path}
                  onClick={() => handleOpenRecent(item.path)}
                  className="flex items-center justify-between px-3 py-2 bg-transparent rounded-md cursor-pointer text-primary gap-2 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-tertiary overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      data-testid={`remove-recent-${item.path}`}
                      onClick={(e) => handleRemoveRecent(e, item.path)}
                      className="flex items-center justify-center w-5 h-5 rounded-sm bg-transparent border-0 text-tertiary cursor-pointer opacity-60 hover:opacity-100 hover:text-diff-remove-text transition-all"
                      title="Xoá repo này khỏi danh sách"
                    >
                      <X size={12} />
                    </button>
                    <ArrowRight size={14} className="text-secondary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CloneModal
        isOpen={isCloneOpen}
        onClose={() => setIsCloneOpen(false)}
        onCloneSuccess={(summary) => onSelectRepo(summary)}
      />
    </div>
  );
};
