import { useMemo } from "react";
import { buildBranchTree } from "../model/branchTree";
import { filterBranchesByName } from "../model/branchFilter";
import { findHeadCommitId } from "../model/headCommit";
import type { useSidebarData } from "./useSidebarData";
import type { ActiveSidebarMenu } from "../model/activeSidebarMenu";

export interface BranchSectionsViewOptions {
  data: ReturnType<typeof useSidebarData>;
  search: string;
  activeMenu: ActiveSidebarMenu;
  setActiveMenu: (menu: ActiveSidebarMenu) => void;
}

/**
 * Derives the filtered branch/tag lists, their tree shapes and the per-kind
 * menu-name accessors the sidebar sections render from. Pure derivation of
 * already-owned state — no IPC, no side effects of its own.
 */
export function useBranchSectionsView({
  data,
  search,
  activeMenu,
  setActiveMenu,
}: BranchSectionsViewOptions) {
  const { branchData, tagItems } = data;

  const localBranches = filterBranchesByName(branchData?.local || [], search);
  const remoteBranches = filterBranchesByName(branchData?.remote || [], search);
  const filteredTags = tagItems.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const branchTree = useMemo(() => buildBranchTree(localBranches), [localBranches]);
  const remoteBranchTree = useMemo(() => buildBranchTree(remoteBranches), [remoteBranches]);

  const menuBranch = activeMenu?.type === "branch" ? activeMenu.name : null;
  const remoteMenuName = activeMenu?.type === "remote" ? activeMenu.name : null;
  const tagMenuOpenName = activeMenu?.type === "tag" ? activeMenu.name : null;
  const setMenuBranch = (name: string | null) =>
    setActiveMenu(name ? { type: "branch", name } : null);
  const setRemoteMenuName = (name: string | null) =>
    setActiveMenu(name ? { type: "remote", name } : null);
  const setTagMenuOpenName = (name: string | null) =>
    setActiveMenu(name ? { type: "tag", name } : null);

  const headCommitId = findHeadCommitId(branchData?.local || []);

  return {
    localBranches,
    remoteBranches,
    filteredTags,
    branchTree,
    remoteBranchTree,
    menuBranch,
    remoteMenuName,
    tagMenuOpenName,
    setMenuBranch,
    setRemoteMenuName,
    setTagMenuOpenName,
    headCommitId,
  };
}
