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
          "group relative flex items-center gap-2 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 min-w-[150px] max-w-[260px] select-none outline-none focus:outline-none focus-visible:outline-none ring-0",
          isActive
            ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface border-t border-x border-border-subtle"
            : "text-secondary hover:text-primary hover:bg-surface-hover/50 font-normal border-t border-x border-transparent"
        )}
        title={`${repoName} - ${tab.id}`}
      >
        <FolderGit2
          size={14}
          className={clsx(
            "shrink-0 transition-colors",
            isActive ? "text-accent" : "text-secondary group-hover:text-primary"
          )}
        />
        <span className="truncate font-semibold">{repoName}</span>

        {branchName && (
          <span
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 max-w-[120px] truncate border",
              isActive
                ? "bg-accent-subtle text-accent border-accent/30 font-medium"
                : "bg-surface-active/70 text-secondary border-border-subtle/60"
            )}
            title={`Branch: ${branchName}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <GitBranch size={10} className="shrink-0 text-emerald-400" />
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
          className="ml-auto flex items-center justify-center w-5 h-5 rounded hover:bg-surface-hover text-secondary hover:text-primary transition-colors shrink-0 outline-none focus:outline-none"
          aria-label={`Close tab ${repoName}`}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
      {showSeparator && <div className="h-4 w-px bg-border-subtle/80 my-auto shrink-0 mx-0.5" />}
    </>
  );
};
