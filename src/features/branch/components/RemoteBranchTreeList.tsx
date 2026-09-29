/**
 * Renders the remote branch tree's root nodes. Split out of
 * BranchSidebarSections to keep that component's own function under the
 * line limit.
 */
import React from "react";
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { type BranchTreeNode } from "../model/branchTree";
import { type SidebarDialog } from "../model/sidebarDialog";
import { RemoteTreeNode } from "./RemoteTreeNode";

export interface RemoteBranchTreeListProps {
  nodes: BranchTreeNode[];
  search: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
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

export const RemoteBranchTreeList: React.FC<RemoteBranchTreeListProps> = ({
  nodes,
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
}) => (
  <>
    {nodes.map((node) => (
      <RemoteTreeNode
        key={node.fullPath}
        node={node}
        search={search}
        expandedFolders={expandedFolders}
        onToggleFolder={onToggleFolder}
        selectedBranch={selectedBranch}
        onSelectBranch={onSelectBranch}
        menuBranch={menuBranch}
        onSetMenuBranch={onSetMenuBranch}
        remoteMenuName={remoteMenuName}
        onSetRemoteMenuName={onSetRemoteMenuName}
        menuRef={menuRef}
        remotesList={remotesList}
        currentBranchName={currentBranchName}
        onCheckout={onCheckout}
        onOpenDialog={onOpenDialog}
      />
    ))}
  </>
);
