import React from "react";
import { X, GitBranch, FolderGit2 } from "lucide-react";
import { clsx } from "clsx";
import { type TabItem } from "../../types/tab";
import { useRepoHeadInfo } from "../../features/repo";

interface RepoWindowTabProps {
  tab: TabItem;
  isActive: boolean;
  showSeparator: boolean;
  onSelect: () => void;
  onClose: () => void;
}

/** An opened-repo tab in the WindowTabBar, with its branch badge and close button. */
export const RepoWindowTab: React.FC<RepoWindowTabProps> = ({
  tab,
  isActive,
  showSeparator,
  onSelect,
  onClose,
}) => {
  const repoName = tab.alias || tab.repo?.name || tab.id.split("/").pop() || "repository";
  // The live HEAD: the tab's own snapshot is taken when it opens and never
  // follows a checkout. Until the query answers, fall back to that snapshot.
  const { data: headInfo } = useRepoHeadInfo(tab.repo?.path);
  const branchName = headInfo ? headInfo.branch_name : tab.repo?.head_branch;

  return (
    <>
      <div
        data-testid={`tab-${tab.id}`}
        onClick={onSelect}
        className={clsx(
          "group relative flex items-center gap-2 px-3 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 min-w-[150px] max-w-[240px] select-none outline-none focus:outline-none focus-visible:outline-none ring-0",
          isActive
            ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
            : "text-secondary hover:text-primary hover:bg-surface/50 dark:hover:bg-white/[0.04] font-normal"
        )}
        title={`${repoName} - ${tab.id}`}
      >
        <FolderGit2
          size={15}
          className={clsx(
            "shrink-0",
            isActive ? "text-accent" : "text-secondary group-hover:text-primary"
          )}
        />
        <span className="truncate">{repoName}</span>

        {branchName && (
          <span
            className={clsx(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 max-w-[85px] truncate border",
              isActive
                ? "bg-accent-subtle text-accent border-accent/25 font-semibold"
                : "bg-surface-header/40 text-secondary border-border-subtle/50"
            )}
            title={`Branch: ${branchName}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <GitBranch size={9} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">{branchName}</span>
          </span>
        )}

        <button
          type="button"
          data-testid={`close-tab-${tab.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-auto flex items-center justify-center w-5 h-5 rounded hover:bg-surface-hover dark:hover:bg-white/10 text-secondary hover:text-primary transition-colors shrink-0 outline-none focus:outline-none"
          aria-label={`Close tab ${repoName}`}
        >
          <X size={12} strokeWidth={1.75} />
        </button>
      </div>
      {showSeparator && (
        <div className="h-4 w-[1px] bg-border-subtle/80 dark:bg-slate-700/60 my-auto shrink-0 mx-0.5" />
      )}
    </>
  );
};
