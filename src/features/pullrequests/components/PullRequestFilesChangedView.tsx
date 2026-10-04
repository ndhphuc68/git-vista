import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../../i18n";
import type { PullRequestFileItem } from "../../../ipc/githubApi";
import { PullRequestPatchDiffViewer } from "./PullRequestPatchDiffViewer";

export interface PullRequestFilesChangedViewProps {
  files: PullRequestFileItem[];
  selectedFilename?: string;
  onSelectFile?: (filename: string) => void;
  className?: string;
}

interface StatusBadgeInfo {
  letter: string;
  className: string;
}

function getFileStatusBadge(status: PullRequestFileItem["status"]): StatusBadgeInfo {
  switch (status) {
    case "added":
      return {
        letter: "A",
        className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      };
    case "modified":
      return {
        letter: "M",
        className: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      };
    case "removed":
      return {
        letter: "D",
        className: "text-rose-500 bg-rose-500/10 border-rose-500/30",
      };
    case "renamed":
      return {
        letter: "R",
        className: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      };
    default:
      return {
        letter: (status as string).charAt(0).toUpperCase() || "M",
        className: "text-secondary bg-surface-header border-border-subtle",
      };
  }
}

const FileSummaryHeader: React.FC<{
  summaryText: string;
  totalAdditions: number;
  totalDeletions: number;
}> = ({ summaryText, totalAdditions, totalDeletions }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
    <div className="text-xs text-secondary font-medium">{summaryText}</div>
    <div className="flex items-center gap-2">
      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
        +{totalAdditions}
      </span>
      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20">
        -{totalDeletions}
      </span>
    </div>
  </div>
);

const FileListItem: React.FC<{
  file: PullRequestFileItem;
  isActive: boolean;
  onSelect: () => void;
}> = ({ file, isActive, onSelect }) => {
  const badge = getFileStatusBadge(file.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full text-left flex items-center justify-between p-2.5 transition-colors border-l-2",
        isActive ? "bg-surface-hover border-accent" : "border-transparent hover:bg-surface-hover/50"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={clsx(
            "w-4 h-4 rounded flex items-center justify-center font-mono text-[10px] font-bold border shrink-0",
            badge.className
          )}
        >
          {badge.letter}
        </span>
        <span className="font-mono text-xs text-primary truncate" title={file.filename}>
          {file.filename}
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 ml-2">
        {file.additions > 0 && (
          <span className="text-emerald-500 font-medium">+{file.additions}</span>
        )}
        {file.deletions > 0 && <span className="text-rose-500 font-medium">-{file.deletions}</span>}
      </div>
    </button>
  );
};

const FileListPane: React.FC<{
  files: PullRequestFileItem[];
  activeFilename?: string;
  onSelectFile: (filename: string) => void;
  noFilesText: string;
}> = ({ files, activeFilename, onSelectFile, noFilesText }) => {
  if (files.length === 0) {
    return (
      <div className="w-full lg:w-80 shrink-0 border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle bg-surface">
        <p className="p-4 text-center text-xs text-tertiary italic">{noFilesText}</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 shrink-0 border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle bg-surface">
      {files.map((file) => (
        <FileListItem
          key={file.filename}
          file={file}
          isActive={file.filename === activeFilename}
          onSelect={() => onSelectFile(file.filename)}
        />
      ))}
    </div>
  );
};

export const PullRequestFilesChangedView: React.FC<PullRequestFilesChangedViewProps> = ({
  files,
  selectedFilename,
  onSelectFile,
  className,
}) => {
  const { t } = useTranslation();
  const [internalSelectedFilename, setInternalSelectedFilename] = React.useState<
    string | undefined
  >(undefined);

  const activeFilename =
    selectedFilename !== undefined
      ? selectedFilename
      : (internalSelectedFilename ?? files[0]?.filename);

  const activeFile = files.find((f) => f.filename === activeFilename) ?? files[0];

  const totalAdditions = React.useMemo(
    () => files.reduce((acc, f) => acc + (f.additions || 0), 0),
    [files]
  );
  const totalDeletions = React.useMemo(
    () => files.reduce((acc, f) => acc + (f.deletions || 0), 0),
    [files]
  );

  const summaryText = t.pullRequestsScreen.files.summary
    .replace("{count}", String(files.length))
    .replace("{additions}", String(totalAdditions))
    .replace("{deletions}", String(totalDeletions));

  const handleSelect = (filename: string) => {
    setInternalSelectedFilename(filename);
    onSelectFile?.(filename);
  };

  return (
    <div className={clsx("space-y-4", className)}>
      <FileSummaryHeader
        summaryText={summaryText}
        totalAdditions={totalAdditions}
        totalDeletions={totalDeletions}
      />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <FileListPane
          files={files}
          activeFilename={activeFile?.filename}
          onSelectFile={handleSelect}
          noFilesText={t.pullRequestsScreen.files.noFiles}
        />

        <div className="flex-1 min-w-0 w-full">
          {activeFile ? (
            <PullRequestPatchDiffViewer filename={activeFile.filename} patch={activeFile.patch} />
          ) : (
            <div className="p-8 text-center text-sm text-secondary bg-surface rounded-xl border border-border-subtle">
              {t.pullRequestsScreen.files.noFiles}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
