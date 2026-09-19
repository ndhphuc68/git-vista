/**
 * One node of the remote branch tree: a remote root (with its prune/edit/
 * delete menu), an intermediate folder, or a remote branch row.
 *
 * Kept separate from BranchTreeNode on purpose — the remote leaf differs from
 * the local one in small but real ways (it always checks out on double click,
 * carries an aria-label, and has no HEAD styling), so the two are not the
 * same component wearing different props.
 */
import React from "react";
import clsx from "clsx";
import {
  Cloud,
  ChevronDown,
  ChevronRight,
  Folder,
  MoreVertical,
  Check,
  GitMerge,
  GitCommit,
  GitCompare,
  Trash2,
  Scissors,
  Edit2,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { countBranchesInNode, type BranchTreeNode as TreeNode } from "../model/branchTree";
import { type SidebarDialog } from "../model/sidebarDialog";

export interface RemoteTreeNodeProps {
  node: TreeNode;
  depth?: number;
  search: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (folderPath: string) => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  menuBranch: string | null;
  onSetMenuBranch: (name: string | null) => void;
  remoteMenuName: string | null;
  onSetRemoteMenuName: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  remotesList: RemoteItem[];
  currentBranchName: string;
  onCheckout: (name: string) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const RemoteTreeNode: React.FC<RemoteTreeNodeProps> = (props) => {
  const {
    node,
    depth = 0,
    search,
    expandedFolders,
    onToggleFolder,
    selectedBranch,
    onSelectBranch,
    menuBranch,
    onSetMenuBranch,
    remoteMenuName,
    onSetRemoteMenuName,
    menuRef,
    remotesList,
    currentBranchName,
    onCheckout,
    onOpenDialog,
  } = props;
  const { t } = useTranslation();

  if (node.isFolder) {
    const isExpanded = search.trim() !== "" || expandedFolders[node.fullPath] !== false;
    const count = countBranchesInNode(node);
    const isRemoteRoot = depth === 0;
    const isRemoteMenuOpen = remoteMenuName === node.name;

    return (
      <div
        key={node.fullPath}
        className="group/remote relative flex flex-col mt-0.5"
        onContextMenu={(e) => {
          if (isRemoteRoot) {
            e.preventDefault();
            e.stopPropagation();
            onSetRemoteMenuName(node.name);
          }
        }}
      >
        <div className="flex items-center justify-between rounded-sm hover:bg-surface-hover group transition-colors pr-1">
          <button
            type="button"
            onClick={() => onToggleFolder(node.fullPath)}
            className="flex items-center justify-between flex-1 px-2 py-1 text-primary font-semibold text-xs cursor-pointer border-0 bg-transparent text-left truncate"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-secondary group-hover:text-primary">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              {isRemoteRoot ? (
                <Cloud size={13} className="text-sky-500 shrink-0" />
              ) : (
                <Folder size={13} className="text-amber-500 shrink-0 fill-amber-500/20" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            <span className="text-[10px] font-mono text-tertiary px-1.5 bg-surface-hover rounded-full ml-1">
              {count}
            </span>
          </button>

          {isRemoteRoot && (
            <div className="relative shrink-0 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetRemoteMenuName(isRemoteMenuOpen ? null : node.name);
                }}
                aria-label={`Menu thao tác remote ${node.name}`}
                className={clsx(
                  "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
                  isRemoteMenuOpen
                    ? "opacity-100"
                    : "opacity-0 group-hover/remote:opacity-100 focus:opacity-100"
                )}
              >
                <MoreVertical size={13} />
              </button>

              {isRemoteMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSetRemoteMenuName(null);
                      onOpenDialog({ kind: "pruneRemote", remoteName: node.name });
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                  >
                    <Scissors size={14} className="text-sky-500 shrink-0" />
                    <span>{t.sidebar.pruneRemote}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSetRemoteMenuName(null);
                      const r = remotesList.find((x) => x.name === node.name) || {
                        name: node.name,
                        fetch_url: null,
                        push_url: null,
                        branch_count: count,
                        is_default: false,
                      };
                      onOpenDialog({ kind: "editRemote", remote: r });
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                  >
                    <Edit2 size={14} className="text-secondary shrink-0" />
                    <span>{t.sidebar.editRemote}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSetRemoteMenuName(null);
                      const r = remotesList.find((x) => x.name === node.name) || {
                        name: node.name,
                        fetch_url: null,
                        push_url: null,
                        branch_count: count,
                        is_default: false,
                      };
                      onOpenDialog({ kind: "deleteRemote", remote: r });
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full whitespace-nowrap transition-colors"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>{t.sidebar.removeRemote}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="tree-guide border-l border-border-subtle ml-3 pl-2 flex flex-col gap-0.5 mt-0.5">
            {node.children.map((child) => (
              <RemoteTreeNode key={child.fullPath} {...props} node={child} depth={depth + 1} />
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
      key={branch.name}
      className="group relative flex items-center justify-between rounded-sm"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSetMenuBranch(branch.name);
      }}
    >
      <button
        onClick={() => onSelectBranch(branch.name)}
        onDoubleClick={() => onCheckout(branch.name)}
        aria-selected={isSelected}
        aria-label={branch.name}
        className={clsx(
          "flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs transition-colors overflow-hidden",
          isSelected
            ? "bg-accent-subtle text-accent font-semibold"
            : "bg-transparent text-primary hover:bg-surface-hover font-normal"
        )}
        title={branch.name}
      >
        <Cloud
          size={11}
          className={clsx("shrink-0", isSelected ? "text-accent" : "text-tertiary")}
        />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{node.name}</span>
      </button>

      {/* Three dots action menu */}
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

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
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
                onOpenDialog({ kind: "merge", targetBranch: branch.name });
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
                onOpenDialog({ kind: "rebase", upstreamBranch: branch.name });
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
                onOpenDialog({
                  kind: "compare",
                  baseRev: currentBranchName,
                  targetRev: branch.name,
                });
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
            >
              <GitCompare size={14} className="text-secondary shrink-0" />
              <span>{t.sidebar.compareWithCurrent.replace("{branch}", currentBranchName)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
