import React, { useMemo } from "react";
import { Search, File } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareFileItem } from "../../ipc/bindings.generated";
import { CompareFileRow } from "./CompareFileRow";

export interface CompareFileListProps {
  files: CompareFileItem[];
  selectedFile: CompareFileItem | null;
  onSelectFile: (file: CompareFileItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export const CompareFileList: React.FC<CompareFileListProps> = ({
  files,
  selectedFile,
  onSelectFile,
  searchQuery,
  onSearchChange,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.path.toLowerCase().includes(q) || (f.old_path && f.old_path.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search filter input */}
      <div className="p-2 border-b border-border-subtle bg-surface/50 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.compare.searchFiles}
            className="w-full pl-7 pr-3 py-1 text-xs rounded bg-window border border-border-subtle text-primary placeholder:text-tertiary focus:outline-hidden focus:border-accent"
          />
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-secondary text-xs gap-2 h-48">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Đang tải danh sách tập tin...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-tertiary text-xs gap-2 h-48 text-center">
            <File size={24} className="opacity-40" />
            <span>{t.compare.noFiles}</span>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <CompareFileRow
              key={file.path}
              file={file}
              isSelected={selectedFile?.path === file.path}
              onSelect={onSelectFile}
            />
          ))
        )}
      </div>
    </div>
  );
};
