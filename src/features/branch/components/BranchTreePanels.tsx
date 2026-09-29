/**
 * The BRANCHES and REMOTES sections together, each with its own collapsible
 * header and tree. Split out of BranchSidebarSections to keep that
 * component's own function under the line limit.
 */
import React from "react";
import type { useSidebarData } from "../hooks/useSidebarData";
import type { useBranchSectionsView } from "../hooks/useBranchSectionsView";
import { type SidebarDialog } from "../model/sidebarDialog";
import { LocalBranchesSection } from "./LocalBranchesSection";
import { RemoteBranchesSection } from "./RemoteBranchesSection";
import { LocalBranchTreeList } from "./LocalBranchTreeList";
import { RemoteBranchTreeList } from "./RemoteBranchTreeList";

export interface BranchTreePanelsProps {
  openSections: { local: boolean; remote: boolean };
  toggleSection: (section: "local" | "remote") => void;
  view: ReturnType<typeof useBranchSectionsView>;
  data: ReturnType<typeof useSidebarData>;
  search: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentBranchName: string;
  onCheckout: (name: string) => void;
  setDialog: (dialog: SidebarDialog) => void;
}

export const BranchTreePanels: React.FC<BranchTreePanelsProps> = ({
  openSections,
  toggleSection,
  view,
  data,
  search,
  expandedFolders,
  onToggleFolder,
  selectedBranch,
  onSelectBranch,
  menuRef,
  currentBranchName,
  onCheckout,
  setDialog,
}) => {
  const {
    localBranches,
    remoteBranches,
    branchTree,
    remoteBranchTree,
    menuBranch,
    setMenuBranch: onSetMenuBranch,
    remoteMenuName,
    setRemoteMenuName,
  } = view;

  return (
    <>
      <LocalBranchesSection
        isOpen={openSections.local}
        onToggle={() => toggleSection("local")}
        count={localBranches.length}
        onCreateBranch={() => setDialog({ kind: "createBranch", fromRef: null })}
      >
        <LocalBranchTreeList
          nodes={branchTree}
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
          setDialog={setDialog}
        />
      </LocalBranchesSection>

      <RemoteBranchesSection
        isOpen={openSections.remote}
        onToggle={() => toggleSection("remote")}
        count={remoteBranches.length}
        isEmpty={remoteBranches.length === 0}
        onManageRemotes={() => setDialog({ kind: "manageRemotes" })}
        onAddRemote={() => setDialog({ kind: "addRemote" })}
      >
        <RemoteBranchTreeList
          nodes={remoteBranchTree}
          search={search}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          selectedBranch={selectedBranch}
          onSelectBranch={onSelectBranch}
          menuBranch={menuBranch}
          onSetMenuBranch={onSetMenuBranch}
          remoteMenuName={remoteMenuName}
          onSetRemoteMenuName={setRemoteMenuName}
          menuRef={menuRef}
          remotesList={data.remotesList}
          currentBranchName={currentBranchName}
          onCheckout={onCheckout}
          onOpenDialog={setDialog}
        />
      </RemoteBranchesSection>
    </>
  );
};
