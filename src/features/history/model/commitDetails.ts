import { formatRelativeTime as i18nFormatRelativeTime } from "../../../i18n";

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

/** Compact `dd/mm/yyyy hh:mm` form for dense lists such as the commit graph. */
export function formatShortDateTime(timestampSec: number): string {
  const date = new Date(timestampSec * 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

export interface FileStatusDict {
  added: string;
  deleted: string;
  renamed: string;
  modified: string;
}

interface FileStatusEntry {
  test: (s: string) => boolean;
  code: string;
  labelKey: keyof FileStatusDict;
  fallbackLabel: string;
  badgeClass: string;
}

const FILE_STATUS_TABLE: FileStatusEntry[] = [
  {
    test: (s) => s.startsWith("A") || s === "ADDED",
    code: "A",
    labelKey: "added",
    fallbackLabel: "Thêm mới",
    badgeClass: "bg-diff-add-bg text-diff-add-text border-diff-add-border font-bold",
  },
  {
    test: (s) => s.startsWith("D") || s === "DELETED",
    code: "D",
    labelKey: "deleted",
    fallbackLabel: "Đã xoá",
    badgeClass: "bg-diff-remove-bg text-diff-remove-text border-diff-remove-border font-bold",
  },
  {
    test: (s) => s.startsWith("R") || s === "RENAMED",
    code: "R",
    labelKey: "renamed",
    fallbackLabel: "Đổi tên",
    badgeClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold",
  },
];

const DEFAULT_FILE_STATUS: FileStatusEntry = {
  test: () => true,
  code: "M",
  labelKey: "modified",
  fallbackLabel: "Sửa đổi",
  badgeClass:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold",
};

export function getFileStatusMeta(status: string, dict?: FileStatusDict) {
  const s = (status || "").toUpperCase();
  const entry = FILE_STATUS_TABLE.find((candidate) => candidate.test(s)) ?? DEFAULT_FILE_STATUS;
  return {
    code: entry.code,
    label: dict?.[entry.labelKey] ?? entry.fallbackLabel,
    badgeClass: entry.badgeClass,
  };
}
