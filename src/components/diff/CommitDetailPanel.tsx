import React, { useEffect, useState, useMemo } from "react";
import clsx from "clsx";
import {
  GitCommit,
  Check,
  Copy,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Folder,
  Calendar,
  Clock,
  Mail,
  UserCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { invokeCommand } from "../../ipc/client";
import { FileDiffViewer } from "./FileDiffViewer";
import { useTranslation, formatRelativeTime as i18nFormatRelativeTime } from "../../i18n";

interface CommitDetailPanelProps {
  onClose?: () => void;
}

const AVATAR_STYLES = [
  { bg: "bg-indigo-600 text-white", ring: "ring-indigo-300 dark:ring-indigo-800" },
  { bg: "bg-emerald-600 text-white", ring: "ring-emerald-300 dark:ring-emerald-800" },
  { bg: "bg-violet-600 text-white", ring: "ring-violet-300 dark:ring-violet-800" },
  { bg: "bg-amber-600 text-white", ring: "ring-amber-300 dark:ring-amber-800" },
  { bg: "bg-rose-600 text-white", ring: "ring-rose-300 dark:ring-rose-800" },
  { bg: "bg-cyan-600 text-white", ring: "ring-cyan-300 dark:ring-cyan-800" },
  { bg: "bg-teal-600 text-white", ring: "ring-teal-300 dark:ring-teal-800" },
];

export function getAuthorAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_STYLES.length;
  return AVATAR_STYLES[index]!;
}

export function getAuthorInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/[\s._-]+/);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatRelativeTime(
  timestampSec: number,
  timeDict?: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    yesterday: string;
    daysAgo: string;
    monthsAgo: string;
    yearsAgo: string;
  }
): string {
  if (timeDict) {
    return i18nFormatRelativeTime(timestampSec, timeDict);
  }
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSec;

  if (diff < 0 || diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 2) return "Hôm qua";
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))} tháng trước`;
  return `${Math.floor(diff / (86400 * 365))} năm trước`;
}

export function formatExactDateTime(timestampSec: number): string {
  const date = new Date(timestampSec * 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export function parseCommitMessage(message: string) {
  const lines = (message || "").split("\n");
  const subject = lines[0] || "";
  const body = lines.slice(1).join("\n").trim();

  const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (match && match[1] && match[3]) {
    return {
      type: match[1].toLowerCase(),
      scope: match[2] || null,
      cleanSubject: match[3],
      fullSubject: subject,
      body,
    };
  }
  return {
    type: null,
    scope: null,
    cleanSubject: subject,
    fullSubject: subject,
    body,
  };
}

export function getTypeBadgeStyle(type: string | null) {
  switch (type) {
    case "feat":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    case "fix":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800";
    case "docs":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    case "refactor":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    case "style":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800";
    case "test":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800";
    case "chore":
      return "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700";
    default:
      return "bg-accent-subtle text-accent border-accent/30";
  }
}

export function splitFilePath(fullPath: string): { dir: string; fileName: string } {
  const lastSlash = fullPath.lastIndexOf("/");
  if (lastSlash === -1) {
    return { dir: "", fileName: fullPath };
  }
  return {
    dir: fullPath.slice(0, lastSlash + 1),
    fileName: fullPath.slice(lastSlash + 1),
  };
}

export function getFileStatusMeta(
  status: string,
  dict?: { added: string; deleted: string; renamed: string; modified: string }
) {
  const s = (status || "").toUpperCase();
  if (s.startsWith("A") || s === "ADDED") {
    return {
      code: "A",
      label: dict?.added ?? "Thêm mới",
      badgeClass:
        "bg-diff-add-bg text-diff-add-text border-diff-add-border font-bold",
    };
  }
  if (s.startsWith("D") || s === "DELETED") {
    return {
      code: "D",
      label: dict?.deleted ?? "Đã xoá",
      badgeClass:
        "bg-diff-remove-bg text-diff-remove-text border-diff-remove-border font-bold",
    };
  }
  if (s.startsWith("R") || s === "RENAMED") {
    return {
      code: "R",
      label: dict?.renamed ?? "Đổi tên",
      badgeClass:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold",
    };
  }
  return {
    code: "M",
    label: dict?.modified ?? "Sửa đổi",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold",
  };
}

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    currentRepo,
    selectedCommitId,
    setSelectedCommit,
    selectedFilePath,
    setSelectedFile,
  } = useRepoStore();
  const { setDetailPanelOpen } = useLayoutStore();

  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedFilePath, setCopiedFilePath] = useState(false);
  const [fileFilter, setFileFilter] = useState("");

  const [filesWidth, setFilesWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("git-vista:commit-detail-files-width");
      const parsed = saved ? parseInt(saved, 10) : 340;
      return isNaN(parsed) || parsed < 260 || parsed > 600 ? 340 : parsed;
    } catch {
      return 340;
    }
  });

  const { data: details, isLoading } = useQuery({
    queryKey: ["commit-details", currentRepo?.path, selectedCommitId],
    queryFn: () =>
      invokeCommand.getCommitDetails(currentRepo!.path, selectedCommitId!),
    enabled: Boolean(currentRepo && selectedCommitId),
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setDetailPanelOpen(false);
      setSelectedCommit(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const firstFile = details?.files[0];
    if (firstFile && !selectedFilePath) {
      setSelectedFile(firstFile.path);
    }
  }, [details, selectedFilePath, setSelectedFile]);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopyFilePath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedFilePath(true);
    setTimeout(() => setCopiedFilePath(false), 2000);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = filesWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 260), 600);
      setFilesWidth(newWidth);
      try {
        localStorage.setItem(
          "git-vista:commit-detail-files-width",
          String(newWidth)
        );
      } catch {
        // ignore
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Commit message parsed with conventional commits & body
  const parsedMsg = useMemo(() => {
    return parseCommitMessage(details?.full_message || "");
  }, [details?.full_message]);

  const authorAvatarStyle = useMemo(() => {
    return getAuthorAvatarStyle(details?.author_name || "");
  }, [details?.author_name]);

  const authorInitials = useMemo(() => {
    return getAuthorInitials(details?.author_name || "");
  }, [details?.author_name]);

  const relativeTime = useMemo(() => {
    return details ? formatRelativeTime(details.author_timestamp_sec, t.diff.time) : "";
  }, [details, t.diff.time]);

  const exactDateTime = useMemo(() => {
    return details ? formatExactDateTime(details.author_timestamp_sec) : "";
  }, [details]);

  // Filtered files list
  const filteredFiles = useMemo(() => {
    if (!details?.files) return [];
    if (!fileFilter.trim()) return details.files;
    const query = fileFilter.toLowerCase();
    return details.files.filter((f) => f.path.toLowerCase().includes(query));
  }, [details?.files, fileFilter]);

  // Navigation between files
  const currentFileIndex = useMemo(() => {
    if (!details?.files || !selectedFilePath) return -1;
    return details.files.findIndex((f) => f.path === selectedFilePath);
  }, [details?.files, selectedFilePath]);

  const selectedFile = useMemo(() => {
    if (!details?.files || !selectedFilePath) return null;
    return details.files.find((f) => f.path === selectedFilePath) || null;
  }, [details?.files, selectedFilePath]);

  const hasPrev = currentFileIndex > 0;
  const hasNext =
    currentFileIndex >= 0 && currentFileIndex < (details?.files.length ?? 0) - 1;

  const handlePrevFile = () => {
    const prevFile = details?.files[currentFileIndex - 1];
    if (hasPrev && prevFile) {
      setSelectedFile(prevFile.path);
    }
  };

  const handleNextFile = () => {
    const nextFile = details?.files[currentFileIndex + 1];
    if (hasNext && nextFile) {
      setSelectedFile(nextFile.path);
    }
  };

  if (!selectedCommitId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2 p-6">
        <GitCommit size={28} className="opacity-40" />
        <span className="font-medium">{t.diff.selectCommitPrompt}</span>
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-3 h-full">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{t.diff.loadingCommitDetails}</span>
      </div>
    );
  }

  const selectedFileMeta = selectedFile ? getFileStatusMeta(selectedFile.status, t.diff.fileStatus) : null;
  const selectedPathParts = selectedFile ? splitFilePath(selectedFile.path) : null;

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-hidden select-none">
      {/* Top Drawer Header Bar */}
      <div className="h-13 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-1.5 rounded-md bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
            <GitCommit size={17} />
          </span>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-sm text-primary tracking-tight">
              {t.diff.commitDetailsTitle}
            </span>
            <button
              type="button"
              onClick={() => handleCopySha(details.id)}
              className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover text-accent font-semibold cursor-pointer transition-colors shadow-2xs"
              title={t.diff.copyShaTooltip}
            >
              <span>{details.id.substring(0, 7)}</span>
              {copiedSha ? (
                <Check size={12} className="text-diff-add-text" />
              ) : (
                <Copy size={12} />
              )}
            </button>
            <span className="text-tertiary text-xs">|</span>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <span className="px-1.5 py-0.5 rounded bg-diff-add-bg text-diff-add-text border border-diff-add-border">
                {`+${details.total_additions}`}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border">
                {`-${details.total_deletions}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.diff.closeDetailAria}
            title={t.diff.closeDetailTitle}
            className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-hover active:bg-surface-active text-secondary hover:text-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-border-subtle shadow-2xs"
          >
            <span>Đóng</span>
            <kbd className="text-[10px] font-mono text-tertiary bg-window px-1 rounded border border-border-subtle">
              Esc
            </kbd>
            <X size={13} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* 2-Column Split: Left = Files & Info, Right = Diff Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Commit Summary & File List */}
        <div
          style={{ width: `${filesWidth}px` }}
          className="border-r border-border-subtle bg-window flex flex-col shrink-0 overflow-hidden"
        >
          {/* Commit Message & Author Hero Card */}
          <div className="p-3.5 border-b border-border-subtle bg-surface flex flex-col gap-3 shadow-2xs">
            {/* Subject with Conventional Commits Type Badge */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2 flex-wrap">
                {parsedMsg.type && (
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase border shadow-2xs shrink-0",
                      getTypeBadgeStyle(parsedMsg.type)
                    )}
                  >
                    {parsedMsg.type}
                    {parsedMsg.scope ? `(${parsedMsg.scope})` : ""}
                  </span>
                )}
                <h3 className="text-sm font-bold text-primary leading-snug break-words flex-1">
                  {parsedMsg.cleanSubject || parsedMsg.fullSubject || details.full_message}
                </h3>
              </div>

              {/* Optional body */}
              {parsedMsg.body && (
                <div className="text-xs text-secondary leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap bg-window/60 p-2.5 rounded-md border border-border-subtle font-sans border-l-2 border-l-accent mt-1">
                  {parsedMsg.body}
                </div>
              )}
            </div>

            {/* Author & Timestamp Section */}
            <div className="flex items-center gap-3 pt-2.5 border-t border-border-subtle/70">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 select-none",
                    authorAvatarStyle.bg,
                    authorAvatarStyle.ring
                  )}
                >
                  {authorInitials}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center shadow-2xs"
                  title={t.diff.authorTitle}
                >
                  <UserCheck size={9} className="text-white stroke-[3]" />
                </div>
              </div>

              {/* Author Meta */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-primary truncate leading-tight">
                    {details.author_name}
                  </span>
                  <div
                    className="flex items-center gap-1 text-[10px] text-accent font-semibold bg-accent-subtle/80 px-1.5 py-0.5 rounded border border-accent/20 shrink-0"
                    title={exactDateTime}
                  >
                    <Clock size={10} className="shrink-0" />
                    <span>{relativeTime}</span>
                  </div>
                </div>

                {details.author_email && (
                  <span className="text-[11px] text-tertiary truncate leading-tight flex items-center gap-1 font-mono mt-0.5">
                    <Mail size={10} className="shrink-0 opacity-70" />
                    <span className="truncate">{details.author_email}</span>
                  </span>
                )}

                <div
                  className="flex items-center gap-1 text-[11px] text-secondary font-mono mt-0.5"
                  title={t.diff.commitTimeTitle}
                >
                  <Calendar size={11} className="shrink-0 text-tertiary" />
                  <span className="truncate">{exactDateTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Files List Header with Search Filter */}
          <div className="p-2 border-b border-border-subtle bg-window flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary tracking-wide uppercase px-1">
              <span>{t.diff.filesChangedHeader}</span>
              <span className="text-tertiary font-mono text-[10px] font-normal lowercase">
                {fileFilter
                  ? t.diff.filesCountFiltered
                      .replace("{filtered}", String(filteredFiles.length))
                      .replace("{total}", String(details.files.length))
                  : t.diff.filesCount.replace("{count}", String(details.files.length))}
              </span>
            </div>

            {/* Search input */}
            <div className="relative flex items-center">
              <Search
                size={12}
                className="absolute left-2.5 text-tertiary pointer-events-none"
              />
              <input
                type="text"
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                placeholder={t.diff.searchFilesPlaceholder}
                className="w-full pl-7 pr-7 py-1 text-xs rounded-md bg-surface border border-border-subtle text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {fileFilter && (
                <button
                  type="button"
                  onClick={() => setFileFilter("")}
                  className="absolute right-2 text-tertiary hover:text-primary cursor-pointer"
                  title={t.diff.clearFilterTitle}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {filteredFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-tertiary">
                {t.diff.noMatchingFiles}
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFilePath === file.path;
                const statusMeta = getFileStatusMeta(file.status, t.diff.fileStatus);
                const { dir, fileName } = splitFilePath(file.path);

                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFile(file.path)}
                    title={file.path}
                    className={clsx(
                      "group flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-all text-left w-full border relative",
                      isSelected
                        ? "bg-accent-subtle/80 border-accent/80 text-primary font-semibold shadow-2xs ring-1 ring-accent/30"
                        : "bg-surface border-border-subtle hover:bg-surface-hover text-primary font-normal"
                    )}
                  >
                    {/* Left Active Indicator Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r" />
                    )}

                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      {/* Status Badge */}
                      <span
                        className={clsx(
                          "w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 border uppercase font-mono",
                          statusMeta.badgeClass
                        )}
                        title={statusMeta.label}
                      >
                        {statusMeta.code}
                      </span>

                      {/* File Name & Path Details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-primary truncate leading-tight">
                          {fileName}
                        </span>
                        {dir && (
                          <span className="text-[10px] text-tertiary truncate leading-tight font-mono">
                            {dir}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additions / Deletions Stats */}
                    <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                      <span className="text-diff-add-text font-semibold">
                        {`+${file.additions}`}
                      </span>
                      <span className="text-diff-remove-text font-semibold">
                        {`-${file.deletions}`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          onDoubleClick={() => setFilesWidth(340)}
          className="w-1 hover:w-1.5 -mr-0.5 h-full cursor-col-resize z-10 transition-all group shrink-0 relative select-none hover:bg-accent active:bg-accent border-r border-border-subtle hover:border-accent"
          title={t.diff.resizerTooltip}
        >
          <div className="w-full h-full" />
        </div>

        {/* Right Column: Code Diff Viewer with Sticky File Header */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
          {selectedFile && currentRepo ? (
            <>
              {/* Sticky File Header */}
              <div className="h-11 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
                {/* Left: Status badge, directory breadcrumb, file name, copy button */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                  {selectedFileMeta && (
                    <span
                      className={clsx(
                        "px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border shrink-0 uppercase font-mono",
                        selectedFileMeta.badgeClass
                      )}
                    >
                      <span>{selectedFileMeta.code}</span>
                      <span className="font-sans font-normal hidden sm:inline text-[10px]">
                        {selectedFileMeta.label}
                      </span>
                    </span>
                  )}

                  <div className="flex items-center text-xs font-mono min-w-0 truncate">
                    <span className="text-tertiary mr-1.5 hidden md:inline font-sans text-[11px]">
                      {t.diff.fileLabel}
                    </span>
                    <span className="font-bold text-primary truncate">
                      {selectedPathParts?.dir
                        ? `${selectedPathParts.dir}${selectedPathParts.fileName}`
                        : `/${selectedFile.path}`}
                    </span>
                  </div>

                  {/* Copy file path button */}
                  <button
                    type="button"
                    onClick={() => handleCopyFilePath(selectedFile.path)}
                    className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-primary transition-colors cursor-pointer shrink-0"
                    title={t.diff.copyPathTooltip}
                  >
                    {copiedFilePath ? (
                      <Check size={13} className="text-diff-add-text" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <div className="flex items-center gap-1 font-mono text-xs shrink-0 ml-1">
                    <span className="text-diff-add-text font-semibold">{`+${selectedFile.additions}`}</span>
                    <span className="text-diff-remove-text font-semibold">{`-${selectedFile.deletions}`}</span>
                  </div>
                </div>

                {/* Right: Prev / Next File Navigation */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-tertiary font-mono mr-1.5">
                    {currentFileIndex >= 0
                      ? `${currentFileIndex + 1} / ${details.files.length}`
                      : ""}
                  </span>

                  <button
                    type="button"
                    onClick={handlePrevFile}
                    disabled={!hasPrev}
                    className="p-1 rounded border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none text-secondary hover:text-primary transition-colors cursor-pointer"
                    title={t.diff.prevFile}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFile}
                    disabled={!hasNext}
                    className="p-1 rounded border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none text-secondary hover:text-primary transition-colors cursor-pointer"
                    title={t.diff.nextFile}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Code Diff Viewer Area */}
              <div className="flex-1 overflow-y-auto p-3">
                <FileDiffViewer
                  repoPath={currentRepo.path}
                  commitId={selectedCommitId}
                  filePath={selectedFile.path}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2">
              <Folder size={24} className="opacity-40" />
              <span>{t.diff.selectFilePrompt}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
