import React from "react";
import { FileCode } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type PullRequestFileItem } from "../../ipc/githubApi";

interface PullRequestChangedFilesProps {
  files: PullRequestFileItem[];
  t: Translations;
}

/** Changed-files list; renders nothing when there are no files. */
export const PullRequestChangedFiles: React.FC<PullRequestChangedFilesProps> = ({ files, t }) => {
  if (files.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
        {t.pullRequests.filesChanged.replace("{count}", String(files.length))}
      </h4>
      <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle bg-surface">
        {files.map((file) => (
          <div
            key={file.filename}
            className="flex items-center justify-between p-2.5 hover:bg-surface-hover text-xs transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileCode size={13} className="text-secondary shrink-0" />
              <span className="font-mono text-[11px] text-primary truncate" title={file.filename}>
                {file.filename}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 ml-2">
              {file.additions > 0 && <span className="text-emerald-500">+{file.additions}</span>}
              {file.deletions > 0 && <span className="text-red-500">-{file.deletions}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
