/**
 * One node of the branch tree: either a collapsible folder or a branch row
 * with its context menu. Purely presentational — every action arrives as a
 * callback so the sidebar keeps ownership of dialog state.
 */
import React from "react";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  MoreVertical,
  Check,
  GitMerge,
  GitCommit,
  GitCompare,
  Edit3,
  Trash2,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { countBranchesInNode, type BranchTreeNode as TreeNode } from "../model/branchTree";

export interface BranchTreeNodeProps {
  node: TreeNode;
  /** A non-empty search box force-expands every folder. */
  search: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (folderPath: string) => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  /** Name of the branch whose menu is open, or null when none is. */
  menuBranch: string | null;
  onSetMenuBranch: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  onMerge: (name: string) => void;
  onRebase: (name: string) => void;
  onCompare: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
}

export const BranchTreeNode: React.FC<BranchTreeNodeProps> = (props) => {
  const {
    node,
    search,
    expandedFolders,
    onToggleFolder,
    selectedBranch,
    onSelectBranch,
    menuBranch,
    onSetMenuBranch,
    menuRef,
    currentBranchName,
    onCheckout,
    onMerge,
    onRebase,
    onCompare,
    onRename,
    onDelete,
  } = props;
  const { t } = useTranslation();

  if (node.isFolder) {
    const isExpanded = search.trim() !== "" || expandedFolders[node.fullPath] !== false;
    const count = countBranchesInNode(node);

    return (
      <div className="flex flex-col mt-0.5">
        <button
          type="button"
          onClick={() => onToggleFolder(node.fullPath)}
          className="flex items-center justify-between px-2 py-1 rounded-sm hover:bg-surface-hover text-primary font-semibold text-xs cursor-pointer border-0 bg-transparent text-left group transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-secondary group-hover:text-primary">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            <Folder size={13} className="text-amber-500 shrink-0 fill-amber-500/20" />
            <span className="truncate">{node.name}</span>
          </div>
          <span className="text-[10px] font-mono text-tertiary px-1.5 bg-surface-hover rounded-full">
            {count}
          </span>
        </button>

        {isExpanded && (
          <div className="tree-guide border-l border-border-subtle ml-3 pl-2 flex flex-col gap-0.5 mt-0.5">
            {node.children.map((child) => (
              <BranchTreeNode key={child.fullPath} {...props} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const branch = node.branch!;
  const isSelected = selectedBranch === branch.name;
  const isMenuOpen = menuBranch === branch.name;

  return (
    <div
      className="group relative flex items-center justify-between rounded-sm"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSetMenuBranch(branch.name);
      }}
    >
      <button
        onClick={() => onSelectBranch(branch.name)}
        onDoubleClick={() => {
          if (!branch.is_head) onCheckout(branch.name);
        }}
        aria-selected={isSelected}
        className={clsx(
          "flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs transition-colors overflow-hidden",
          isSelected
            ? "bg-accent-subtle text-accent font-semibold"
            : "bg-transparent text-primary hover:bg-surface-hover font-normal",
          branch.is_head && "font-semibold"
        )}
        title={
          branch.is_head ? `${branch.name} (HEAD)` : `Nhấn đúp để chuyển sang nhánh ${branch.name}`
        }
      >
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            branch.is_head ? "bg-accent" : "border border-tertiary bg-transparent"
          )}
        />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{node.name}</span>
        {branch.is_head && (
          <span className="text-[10px] text-accent ml-auto shrink-0 px-1 py-0.2 bg-accent/10 rounded-xs font-semibold">
            HEAD
          </span>
        )}
      </button>

      {/* Three dots menu button */}
      <div className="relative shrink-0 flex items-center pr-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetMenuBranch(isMenuOpen ? null : branch.name);
          }}
          aria-label={`Menu thao tác nhánh ${branch.name}`}
          className={clsx(
            "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreVertical size={13} />
        </button>

        {/* Dropdown Action Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {!branch.is_head && (
              <>
                <button
                  type="button"
                  onClick={() => onCheckout(branch.name)}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                >
                  <Check size={14} className="text-accent shrink-0" />
                  <span>{t.sidebar.checkoutBranch}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSetMenuBranch(null);
                    onMerge(branch.name);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                >
                  <GitMerge size={14} className="text-secondary shrink-0" />
                  <span>{t.sidebar.mergeIntoCurrent}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSetMenuBranch(null);
                    onRebase(branch.name);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                >
                  <GitCommit size={14} className="text-secondary shrink-0" />
                  <span>{t.sidebar.rebaseOntoThis}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSetMenuBranch(null);
                    onCompare(branch.name);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                >
                  <GitCompare size={14} className="text-secondary shrink-0" />
                  <span>{t.sidebar.compareWithCurrent.replace("{branch}", currentBranchName)}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                onSetMenuBranch(null);
                onRename(branch.name);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
            >
              <Edit3 size={14} className="text-secondary shrink-0" />
              <span>{t.sidebar.renameBranch}</span>
            </button>

            {!branch.is_head && (
              <button
                type="button"
                onClick={() => {
                  onSetMenuBranch(null);
                  onDelete(branch.name);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full whitespace-nowrap transition-colors"
              >
                <Trash2 size={14} className="shrink-0" />
                <span>{t.sidebar.deleteBranch}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
