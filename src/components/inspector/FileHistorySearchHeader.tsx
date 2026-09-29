import React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "../../i18n";

interface FileHistorySearchHeaderProps {
  totalCount: number;
  filterText: string;
  onFilterTextChange: (value: string) => void;
}

/** Title + search input above FileHistoryView's commit list. */
export const FileHistorySearchHeader: React.FC<FileHistorySearchHeaderProps> = ({
  totalCount,
  filterText,
  onFilterTextChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-2 border-b border-border-subtle bg-window flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between text-[11px] font-bold text-secondary tracking-wide uppercase px-1">
        <span>{t.inspector.historyTab}</span>
        <span className="text-tertiary font-mono text-[10px] lowercase">
          {t.inspector.totalCommits.replace("{count}", String(totalCount))}
        </span>
      </div>

      <div className="relative flex items-center">
        <Search size={12} className="absolute left-2.5 text-tertiary pointer-events-none" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          placeholder={t.inspector.searchHistoryPlaceholder}
          className="w-full pl-7 pr-7 py-1 text-xs rounded-md bg-surface border border-border-subtle text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
        {filterText && (
          <button
            type="button"
            onClick={() => onFilterTextChange("")}
            className="absolute right-2 text-tertiary hover:text-primary cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
