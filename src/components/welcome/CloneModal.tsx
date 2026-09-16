import React, { useState, useEffect, useRef } from "react";
import { FolderOpen, X, Download, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand, listenToTaskProgress } from "../../ipc/client";
import { RepoSummary } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

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
  const { t } = useTranslation();
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
      setError(t.cloneModal.cancelError);
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
    setStatusText(t.cloneModal.initStatus);

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
          : err?.message || t.cloneModal.defaultError
      );
    } finally {
      setIsCloning(false);
      activeTaskIdRef.current = null;
    }
  };

  return (
    <Transition
      show={isOpen}
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clone-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
        onClick={handleCancel}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCloning}
          className="absolute top-4 right-4 text-tertiary hover:text-primary p-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
          aria-label={t.cloneModal.close}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-subtle text-accent">
            <Download size={22} />
          </div>
          <div>
            <h2 id="clone-modal-title" className="text-lg font-bold text-primary">
              {t.cloneModal.title}
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              {t.cloneModal.desc}
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 bg-diff-remove-bg text-diff-remove-text rounded-xl text-xs sm:text-sm border border-diff-remove-border flex items-start gap-2.5"
          >
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <div>
            <label
              htmlFor="clone-url"
              className="block text-xs sm:text-sm font-semibold text-primary mb-1.5"
            >
              {t.cloneModal.urlLabel}
            </label>
            <input
              ref={urlInputRef}
              id="clone-url"
              type="text"
              required
              disabled={isCloning}
              value={url}
              onChange={handleUrlChange}
              placeholder={t.cloneModal.urlPlaceholder}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="clone-target-dir"
              className="block text-xs sm:text-sm font-semibold text-primary mb-1.5"
            >
              {t.cloneModal.targetDirLabel}
            </label>
            <div className="flex gap-2">
              <input
                id="clone-target-dir"
                type="text"
                required
                disabled={isCloning}
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                placeholder={t.cloneModal.targetDirPlaceholder}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={isCloning}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-secondary hover:text-primary bg-window border border-border-subtle hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <FolderOpen size={16} />
                <span>{t.cloneModal.selectFolder}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar (during cloning) */}
          {isCloning && (
            <div className="mt-1 p-3.5 rounded-xl bg-window border border-border-subtle">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="flex items-center gap-2 text-secondary">
                  <Loader2 size={15} className="animate-spin text-accent" />
                  <span>{t.cloneModal.cloning}</span>
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
                className="h-2 w-full bg-surface rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {statusText && (
                <p className="mt-2 text-xs text-tertiary truncate font-mono">
                  {statusText}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-secondary hover:text-primary bg-transparent hover:bg-surface-hover border border-border-subtle rounded-lg transition-colors cursor-pointer"
            >
              {t.cloneModal.cancel}
            </button>
            <button
              type="submit"
              disabled={!url.trim() || !targetDir.trim() || isCloning}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-accent-contrast bg-accent hover:bg-accent-hover active:scale-[0.99] rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCloning ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{t.cloneModal.cloning}</span>
                </>
              ) : (
                <span>{t.cloneModal.clone}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Transition>
  );
};
