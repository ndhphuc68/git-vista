import { useTranslation } from "../../../i18n";
import type { CommitFile } from "../api/useCommitDetails";
import { CommitFileListHeader } from "./CommitFileListHeader";
import { CommitFileListRow } from "./CommitFileListRow";

interface CommitFileListProps {
  files: CommitFile[];
  filteredFiles: CommitFile[];
  fileFilter: string;
  setFileFilter: (filter: string) => void;
  selectedFilePath: string | null;
  setSelectedFile: (path: string) => void;
  selectedCommitId: string;
}

export function CommitFileList({
  files,
  filteredFiles,
  fileFilter,
  setFileFilter,
  selectedFilePath,
  setSelectedFile,
  selectedCommitId,
}: CommitFileListProps) {
  const { t } = useTranslation();
  return (
    <>
      <CommitFileListHeader
        totalCount={files.length}
        filteredCount={filteredFiles.length}
        fileFilter={fileFilter}
        setFileFilter={setFileFilter}
      />

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {filteredFiles.length === 0 ? (
          <div className="py-6 text-center text-xs text-tertiary">{t.diff.noMatchingFiles}</div>
        ) : (
          filteredFiles.map((file) => (
            <CommitFileListRow
              key={file.path}
              file={file}
              isSelected={selectedFilePath === file.path}
              setSelectedFile={setSelectedFile}
              selectedCommitId={selectedCommitId}
            />
          ))
        )}
      </div>
    </>
  );
}
