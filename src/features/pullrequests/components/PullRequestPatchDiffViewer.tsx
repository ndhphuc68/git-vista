import React from "react";
import clsx from "clsx";
import { FileText } from "lucide-react";
import { useTranslation } from "../../../i18n";

import { useDiffDisplaySettings } from "../../../components/diff/useDiffDisplaySettings";
import { parsePatch, type DiffLineType, type ParsedDiffLine } from "../model/patchParser";

export type { DiffLineType, ParsedDiffLine };

export interface PullRequestPatchDiffViewerProps {
  patch?: string;
  filename: string;
}

interface PatchLineRowProps {
  line: ParsedDiffLine;
  showLineNumbers: boolean;
}

const PatchLineRow: React.FC<PatchLineRowProps> = ({ line, showLineNumbers }) => (
  <div
    className={clsx(
      "flex items-stretch",
      line.type === "add" &&
        "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-l-2 border-emerald-500",
      line.type === "del" &&
        "bg-rose-500/10 text-rose-800 dark:text-rose-200 border-l-2 border-rose-500",
      line.type === "ctx" && "text-primary border-l-2 border-transparent"
    )}
  >
    {showLineNumbers && (
      <>
        <span className="w-10 text-right select-none text-tertiary px-1 shrink-0">
          {line.oldLine ?? ""}
        </span>
        <span className="w-10 text-right select-none text-tertiary px-1 shrink-0">
          {line.newLine ?? ""}
        </span>
      </>
    )}
    <span className="w-4 text-center select-none text-tertiary shrink-0">{line.sign}</span>
    <span className="whitespace-pre-wrap break-all flex-1 px-1">{line.content}</span>
  </div>
);

export const PullRequestPatchDiffViewer: React.FC<PullRequestPatchDiffViewerProps> = ({
  patch,
  filename,
}) => {
  const { t } = useTranslation();
  const { style, showLineNumbers } = useDiffDisplaySettings();

  if (!patch || !patch.trim()) {
    return (
      <div className="bg-surface rounded-lg border border-border-subtle overflow-hidden">
        <div className="px-3 py-2 bg-surface-header border-b border-border-subtle font-mono text-xs text-primary font-medium flex items-center gap-2">
          <FileText size={14} className="text-secondary shrink-0" aria-hidden="true" />
          <span className="truncate">{filename}</span>
        </div>
        <div className="p-6 text-center text-secondary text-sm">
          {t.pullRequestsScreen.files.noDiff}
        </div>
      </div>
    );
  }

  const lines = parsePatch(patch);

  return (
    <div
      style={style}
      className="overflow-x-auto font-mono text-xs leading-5 bg-surface rounded-lg border border-border-subtle"
    >
      <div className="px-3 py-2 bg-surface-header border-b border-border-subtle font-mono text-xs text-primary font-medium flex items-center gap-2 sticky left-0">
        <FileText size={14} className="text-secondary shrink-0" aria-hidden="true" />
        <span className="truncate">{filename}</span>
      </div>
      <div className="min-w-fit">
        {lines.map((line) => {
          if (line.type === "hunk") {
            return (
              <div
                key={line.id}
                className="bg-surface-header/60 text-secondary font-mono text-[11px] px-3 py-1 select-none"
              >
                {line.content}
              </div>
            );
          }

          return <PatchLineRow key={line.id} line={line} showLineNumbers={showLineNumbers} />;
        })}
      </div>
    </div>
  );
};
