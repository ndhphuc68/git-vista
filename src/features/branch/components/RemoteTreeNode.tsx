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
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { countBranchesInNode, type BranchTreeNode as TreeNode } from "../model/branchTree";
import { type SidebarDialog } from "../model/sidebarDialog";
import { RemoteFolderRow } from "./RemoteFolderRow";
import { RemoteBranchRow } from "./RemoteBranchRow";

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
    remoteMenuName,
    onSetRemoteMenuName,
    menuRef,
    remotesList,
    onOpenDialog,
  } = props;

  if (node.isFolder) {
    const isExpanded = search.trim() !== "" || expandedFolders[node.fullPath] !== false;

    return (
      <RemoteFolderRow
        name={node.name}
        fullPath={node.fullPath}
        isExpanded={isExpanded}
        count={countBranchesInNode(node)}
        isRemoteRoot={depth === 0}
        remoteMenuName={remoteMenuName}
        onSetRemoteMenuName={onSetRemoteMenuName}
        menuRef={menuRef}
        remotesList={remotesList}
        onToggle={() => onToggleFolder(node.fullPath)}
        onOpenDialog={onOpenDialog}
      >
        {node.children.map((child) => (
          <RemoteTreeNode key={child.fullPath} {...props} node={child} depth={depth + 1} />
        ))}
      </RemoteFolderRow>
    );
  }

  const {
    selectedBranch,
    onSelectBranch,
    menuBranch,
    onSetMenuBranch,
    currentBranchName,
    onCheckout,
  } = props;

  return (
    <RemoteBranchRow
      branchName={node.branch!.name}
      name={node.name}
      selectedBranch={selectedBranch}
      onSelectBranch={onSelectBranch}
      menuBranch={menuBranch}
      onSetMenuBranch={onSetMenuBranch}
      menuRef={menuRef}
      currentBranchName={currentBranchName}
      onCheckout={onCheckout}
      onOpenDialog={onOpenDialog}
    />
  );
};
