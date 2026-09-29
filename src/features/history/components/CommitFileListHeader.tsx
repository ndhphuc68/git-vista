import { Search, X } from "lucide-react";
import { useTranslation } from "../../../i18n";

interface CommitFileListHeaderProps {
  totalCount: number;
  filteredCount: number;
  fileFilter: string;
  setFileFilter: (filter: string) => void;
}

/** Files-changed count header plus the search filter input. */
export function CommitFileListHeader({
  totalCount,
  filteredCount,
  fileFilter,
  setFileFilter,
}: CommitFileListHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="p-2 border-b border-border-subtle bg-window flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-secondary tracking-wide uppercase px-1">
        <span>{t.diff.filesChangedHeader}</span>
        <span className="text-tertiary font-mono text-[10px] font-normal lowercase">
          {fileFilter
            ? t.diff.filesCountFiltered
                .replace("{filtered}", String(filteredCount))
                .replace("{total}", String(totalCount))
            : t.diff.filesCount.replace("{count}", String(totalCount))}
        </span>
      </div>

      <div className="relative flex items-center">
        <Search size={12} className="absolute left-2.5 text-tertiary pointer-events-none" />
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
  );
}
