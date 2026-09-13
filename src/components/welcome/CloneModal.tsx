import React, { useState, useEffect, useRef } from "react";
import { FolderOpen, X, Download, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand, listenToTaskProgress } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";

export interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloneSuccess: (repo: RepoSummary) => void;
}

export const extractRepoNameFromUrl = (url: string): string => {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const withoutGit = cleanUrl.endsWith(".git") ? cleanUrl.slice(0, -4) : cleanUrl;
  const parts = withoutGit.split(/[/:]/);
  const lastPart = parts.pop();
  return lastPart ? lastPart.trim() : "";
};

export const CloneModal: React.FC<CloneModalProps> = ({
  isOpen,
  onClose,
  onCloneSuccess,
}) => {
  const [url, setUrl] = useState("");
  const [targetDir, setTargetDir] = useState("");
  const [baseDir, setBaseDir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("");
  const activeTaskIdRef = useRef<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTargetDir("");
      setBaseDir("");
      setError(null);
      setIsCloning(false);
      setProgressPercent(0);
      setStatusText("");
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    if (isOpen) {
      listenToTaskProgress((payload) => {
        if (payload.task_id === activeTaskIdRef.current) {
          setProgressPercent(payload.progress_percent);
          setStatusText(payload.status_text);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isCloning) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCloning, onClose]);

  if (!isOpen) return null;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    const repoName = extractRepoNameFromUrl(newUrl);

    if (repoName) {
      if (baseDir) {
        const separator = baseDir.includes("\\") ? "\\" : "/";
        setTargetDir(`${baseDir}${separator}${repoName}`);
      } else if (!targetDir || targetDir.endsWith(repoName) || !targetDir.includes("/") && !targetDir.includes("\\")) {
        setTargetDir(repoName);
      }
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await invokeCommand.selectRepoFolder();
      if (selected) {
        setBaseDir(selected);
        const repoName = extractRepoNameFromUrl(url);
        const separator = selected.includes("\\") ? "\\" : "/";
        if (repoName) {
          setTargetDir(`${selected}${separator}${repoName}`);
        } else {
          setTargetDir(selected);
        }
      }
    } catch (err: any) {
      console.warn("Folder picker error:", err);
    }
  };

  const handleCancel = async () => {
    if (isCloning && activeTaskIdRef.current) {
      await invokeCommand.cancelRemoteTask(activeTaskIdRef.current);
      setIsCloning(false);
      setError("Đã huỷ thao tác clone.");
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !targetDir.trim() || isCloning) return;

    setError(null);
    setIsCloning(true);
    setProgressPercent(0);
    setStatusText("Đang khởi tạo clone...");

    const taskId = `task-clone-${Date.now()}`;
    activeTaskIdRef.current = taskId;

    try {
      await invokeCommand.cloneRepo(url.trim(), targetDir.trim(), taskId);
      const summary = await invokeCommand.openRepository(targetDir.trim());
      onCloneSuccess(summary);
      onClose();
    } catch (err: any) {
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Không thể clone kho chứa từ URL này. Vui lòng kiểm tra lại."
      );
    } finally {
      setIsCloning(false);
      activeTaskIdRef.current = null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clone-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCloning}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-sm cursor-pointer disabled:opacity-50 transition-colors"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-subtle text-accent">
            <Download size={20} />
          </div>
          <div>
            <h2 id="clone-modal-title" className="text-base font-bold text-primary">
              Clone Repository
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Tải toàn bộ lịch sử kho chứa từ xa về máy tính
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="mb-4 px-3.5 py-2.5 bg-diff-remove-bg text-diff-remove-text rounded-md text-xs border border-diff-remove-border flex items-start gap-2"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="clone-url"
              className="block text-xs font-semibold text-primary mb-1.5"
            >
              URL kho chứa (Git URL)
            </label>
            <input
              ref={urlInputRef}
              id="clone-url"
              type="text"
              required
              disabled={isCloning}
              value={url}
              onChange={handleUrlChange}
              placeholder="https://github.com/user/repo.git hoặc git@github.com:..."
              className="w-full px-3 py-2 text-xs bg-window border border-border-subtle rounded-md text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="clone-target-dir"
              className="block text-xs font-semibold text-primary mb-1.5"
            >
              Thư mục đích trên máy
            </label>
            <div className="flex gap-2">
              <input
                id="clone-target-dir"
                type="text"
                required
                disabled={isCloning}
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                placeholder="Đường dẫn thư mục lưu repo..."
                className="flex-1 px-3 py-2 text-xs bg-window border border-border-subtle rounded-md text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={isCloning}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-secondary hover:text-primary bg-window border border-border-subtle hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <FolderOpen size={14} />
                <span>Chọn thư mục</span>
              </button>
            </div>
          </div>

          {/* Progress Bar (during cloning) */}
          {isCloning && (
            <div className="mt-1 p-3 rounded-lg bg-window border border-border-subtle">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-secondary">
                  <Loader2 size={13} className="animate-spin text-accent" />
                  <span>Đang clone kho chứa...</span>
                </span>
                <span className="font-mono font-medium text-accent">
                  {progressPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full bg-surface rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {statusText && (
                <p className="mt-1.5 text-[11px] text-tertiary truncate font-mono">
                  {statusText}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-1.5 text-xs font-medium text-secondary hover:text-primary bg-transparent hover:bg-surface-hover border border-border-subtle rounded-md transition-colors cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!url.trim() || !targetDir.trim() || isCloning}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-accent-contrast bg-accent hover:bg-accent-hover active:scale-[0.99] rounded-md transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCloning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang clone...</span>
                </>
              ) : (
                <span>Clone</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
