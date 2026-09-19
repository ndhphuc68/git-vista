/**
 * Turns the flat branch list from git into the folder tree the sidebar shows.
 * Branch names use "/" as a separator, so "feature/login" becomes a "feature"
 * folder holding a "login" leaf. Pure logic: no React, no IPC.
 */
import { type BranchItem } from "../../../ipc/bindings.generated";

export interface BranchTreeNode {
  isFolder: boolean;
  name: string;
  fullPath: string;
  branch?: BranchItem;
  children: BranchTreeNode[];
}

export function buildBranchTree(branches: BranchItem[]): BranchTreeNode[] {
  const root: BranchTreeNode[] = [];

  for (const b of branches) {
    const parts = b.name.split("/");
    if (parts.length === 1) {
      root.push({
        isFolder: false,
        name: b.name,
        fullPath: b.name,
        branch: b,
        children: [],
      });
      continue;
    }

    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (isLast) {
        currentLevel.push({
          isFolder: false,
          name: part,
          fullPath: b.name,
          branch: b,
          children: [],
        });
      } else {
        let folderNode: BranchTreeNode | undefined = currentLevel.find(
          (n) => n.isFolder && n.name === part
        );
        if (!folderNode) {
          const newFolder: BranchTreeNode = {
            isFolder: true,
            name: part,
            fullPath: currentPath,
            children: [],
          };
          currentLevel.push(newFolder);
          folderNode = newFolder;
        }
        currentLevel = folderNode.children;
      }
    }
  }

  return root;
}

export function countBranchesInNode(node: BranchTreeNode): number {
  if (!node.isFolder) return 1;
  return node.children.reduce((acc, child) => acc + countBranchesInNode(child), 0);
}
