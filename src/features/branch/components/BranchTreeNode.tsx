/**
 * One node of the branch tree: either a collapsible folder or a branch row
 * with its context menu. Purely presentational — every action arrives as a
 * callback so the sidebar keeps ownership of dialog state.
 */
import React from "react";
import { countBranchesInNode, type BranchTreeNode as TreeNode } from "../model/branchTree";
import { BranchFolderRow } from "./BranchFolderRow";
import { BranchLeafRow } from "./BranchLeafRow";

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
  onCreateBranchFrom: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
}

export const BranchTreeNode: React.FC<BranchTreeNodeProps> = (props) => {
  const { node, search, expandedFolders, onToggleFolder } = props;

  if (node.isFolder) {
    const isExpanded = search.trim() !== "" || expandedFolders[node.fullPath] !== false;

    return (
      <BranchFolderRow
        name={node.name}
        isExpanded={isExpanded}
        count={countBranchesInNode(node)}
        onToggle={() => onToggleFolder(node.fullPath)}
      >
        {node.children.map((child) => (
          <BranchTreeNode key={child.fullPath} {...props} node={child} />
        ))}
      </BranchFolderRow>
    );
  }

  const {
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
    onCreateBranchFrom,
    onRename,
    onDelete,
  } = props;

  return (
    <BranchLeafRow
      branch={node.branch!}
      name={node.name}
      selectedBranch={selectedBranch}
      onSelectBranch={onSelectBranch}
      menuBranch={menuBranch}
      onSetMenuBranch={onSetMenuBranch}
      menuRef={menuRef}
      currentBranchName={currentBranchName}
      onCheckout={onCheckout}
      onMerge={onMerge}
      onRebase={onRebase}
      onCompare={onCompare}
      onCreateBranchFrom={onCreateBranchFrom}
      onRename={onRename}
      onDelete={onDelete}
    />
  );
};
