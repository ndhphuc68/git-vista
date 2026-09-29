/**
 * Renders the local branch tree's root nodes, wiring each one to the dialogs
 * it can open. Split out of BranchSidebarSections to keep that component's
 * own function under the line limit.
 */
import React from "react";
import { type BranchTreeNode } from "../model/branchTree";
import { type SidebarDialog } from "../model/sidebarDialog";
import { BranchTreeNode as BranchTreeNodeView } from "./BranchTreeNode";

export interface LocalBranchTreeListProps {
  nodes: BranchTreeNode[];
  search: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  menuBranch: string | null;
  onSetMenuBranch: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  setDialog: (dialog: SidebarDialog) => void;
}

export const LocalBranchTreeList: React.FC<LocalBranchTreeListProps> = ({
  nodes,
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
  setDialog,
}) => (
  <>
    {nodes.map((node) => (
      <BranchTreeNodeView
        key={node.fullPath}
        node={node}
        search={search}
        expandedFolders={expandedFolders}
        onToggleFolder={onToggleFolder}
        selectedBranch={selectedBranch}
        onSelectBranch={onSelectBranch}
        menuBranch={menuBranch}
        onSetMenuBranch={onSetMenuBranch}
        menuRef={menuRef}
        currentBranchName={currentBranchName}
        onCheckout={onCheckout}
        onMerge={(name) => setDialog({ kind: "merge", targetBranch: name })}
        onRebase={(name) => setDialog({ kind: "rebase", upstreamBranch: name })}
        onCompare={(name) =>
          setDialog({ kind: "compare", baseRev: currentBranchName, targetRev: name })
        }
        onRename={(name) => setDialog({ kind: "renameBranch", name })}
        onDelete={(name) => setDialog({ kind: "deleteBranch", name })}
      />
    ))}
  </>
);
