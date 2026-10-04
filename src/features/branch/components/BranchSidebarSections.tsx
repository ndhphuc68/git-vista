import React from "react";
import type { SidebarDialog } from "../model/sidebarDialog";
import type { ActiveSidebarMenu } from "../model/activeSidebarMenu";
import type { StashItem } from "../../../ipc/bindings.generated";
import type { useSidebarData } from "../hooks/useSidebarData";
import type { useSidebarActions } from "../hooks/useSidebarActions";
import { useBranchSectionsView } from "../hooks/useBranchSectionsView";
import { BranchSidebarSearchBox } from "./BranchSidebarSearchBox";
import { BranchTreePanels } from "./BranchTreePanels";
import { BranchSidebarExtraSections } from "./BranchSidebarExtraSections";

interface BranchSidebarSectionsProps {
  data: ReturnType<typeof useSidebarData>;
  actions: ReturnType<typeof useSidebarActions>;
  search: string;
  setSearch: (value: string) => void;
  openSections: { local: boolean; remote: boolean; tags: boolean; stash: boolean };
  toggleSection: (section: "local" | "remote" | "tags" | "stash") => void;
  selectedStash: StashItem | null;
  setSelectedStash: (stash: StashItem | null) => void;
  selectedBranch: string | null;
  setSelectedBranch: (name: string) => void;
  currentBranchName: string;
  activeMenu: ActiveSidebarMenu;
  setActiveMenu: (menu: ActiveSidebarMenu) => void;
  activeMenuRef: React.RefObject<HTMLDivElement | null>;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  handleCheckout: (name: string) => Promise<void>;
  setDialog: (dialog: SidebarDialog) => void;
}

/** Section markup and display derivations; the sidebar retains UI state. */
export function BranchSidebarSections({
  data,
  actions,
  search,
  setSearch,
  openSections,
  toggleSection,
  selectedStash,
  setSelectedStash,
  selectedBranch,
  setSelectedBranch,
  currentBranchName,
  activeMenu,
  setActiveMenu,
  activeMenuRef,
  expandedFolders,
  toggleFolder,
  handleCheckout,
  setDialog,
}: BranchSidebarSectionsProps) {
  const view = useBranchSectionsView({ data, search, activeMenu, setActiveMenu });

  return (
    <aside className="bg-surface border-r border-border-subtle w-full shrink-0 h-full flex flex-col">
      <BranchSidebarSearchBox search={search} setSearch={setSearch} />

      <div
        data-testid="branch-sidebar-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-3"
      >
        <BranchTreePanels
          openSections={openSections}
          toggleSection={toggleSection}
          view={view}
          data={data}
          search={search}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          menuRef={activeMenuRef}
          currentBranchName={currentBranchName}
          onCheckout={handleCheckout}
          setDialog={setDialog}
        />

        <BranchSidebarExtraSections
          openSections={openSections}
          toggleSection={toggleSection}
          view={view}
          data={data}
          actions={actions}
          menuRef={activeMenuRef}
          selectedStash={selectedStash}
          setSelectedStash={setSelectedStash}
          onOpenDialog={setDialog}
        />
      </div>
    </aside>
  );
}
