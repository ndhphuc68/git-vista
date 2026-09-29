import React from "react";
import { GitPullRequest, X } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type GitHubRepoInfo } from "../../ipc/bindings.generated";

interface CreatePullRequestModalHeaderProps {
  titleId: string;
  repoInfo: GitHubRepoInfo | undefined;
  onClose: () => void;
  t: Translations;
}

/** Header. Kept custom rather than using Modal.Header: it carries
 *  the owner/repo subtitle under the title. */
export const CreatePullRequestModalHeader: React.FC<CreatePullRequestModalHeaderProps> = ({
  titleId,
  repoInfo,
  onClose,
  t,
}) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
        <GitPullRequest size={16} />
      </div>
      <div>
        <h3 id={titleId} className="text-sm font-semibold text-primary m-0 leading-tight">
          {t.pullRequests.createModalTitle}
        </h3>
        {repoInfo?.owner && repoInfo?.repo && (
          <p className="text-[11px] text-secondary m-0 leading-tight mt-0.5 font-mono">
            {repoInfo.owner}/{repoInfo.repo}
          </p>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1.5 rounded-md transition-colors"
      aria-label={t.common.close}
    >
      <X size={16} />
    </button>
  </div>
);
