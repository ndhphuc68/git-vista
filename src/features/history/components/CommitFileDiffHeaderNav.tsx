import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "../../../i18n";

interface CommitFileDiffHeaderNavProps {
  fileCount: number;
  currentFileIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  handlePrevFile: () => void;
  handleNextFile: () => void;
}

/** Right side of the file diff header: file index counter and prev/next buttons. */
export function CommitFileDiffHeaderNav({
  fileCount,
  currentFileIndex,
  hasPrev,
  hasNext,
  handlePrevFile,
  handleNextFile,
}: CommitFileDiffHeaderNavProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[11px] text-tertiary font-mono mr-1.5">
        {currentFileIndex >= 0 ? `${currentFileIndex + 1} / ${fileCount}` : ""}
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
  );
}
