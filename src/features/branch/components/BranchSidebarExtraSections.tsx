/**
 * The TAGS and STASHES sections together. Split out of
 * BranchSidebarSections to keep that component's own function under the
 * line limit.
 */
import React from "react";
import { type StashItem } from "../../../ipc/bindings.generated";
import type { useSidebarData } from "../hooks/useSidebarData";
import type { useSidebarActions } from "../hooks/useSidebarActions";
import type { useBranchSectionsView } from "../hooks/useBranchSectionsView";
import { type SidebarDialog } from "../model/sidebarDialog";
import { TagSection } from "./TagSection";
import { StashSection } from "./StashSection";

export interface BranchSidebarExtraSectionsProps {
  openSections: { tags: boolean; stash: boolean };
  toggleSection: (section: "tags" | "stash") => void;
  view: ReturnType<typeof useBranchSectionsView>;
  data: ReturnType<typeof useSidebarData>;
  actions: ReturnType<typeof useSidebarActions>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  selectedStash: StashItem | null;
  setSelectedStash: (stash: StashItem | null) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const BranchSidebarExtraSections: React.FC<BranchSidebarExtraSectionsProps> = ({
  openSections,
  toggleSection,
  view,
  data,
  actions,
  menuRef,
  selectedStash,
  setSelectedStash,
  onOpenDialog,
}) => (
  <>
    {/* TAGS */}
    <TagSection
      isOpen={openSections.tags}
      onToggle={() => toggleSection("tags")}
      tags={view.filteredTags}
      totalTagCount={data.tagItems.length}
      headCommitId={view.headCommitId}
      openMenuTag={view.tagMenuOpenName}
      onSetMenuTag={view.setTagMenuOpenName}
      menuRef={menuRef}
      onCheckoutTag={actions.checkoutTag}
      onPushTag={actions.pushTag}
      onOpenDialog={onOpenDialog}
    />

    {/* STASHES */}
    <StashSection
      isOpen={openSections.stash}
      onToggle={() => toggleSection("stash")}
      stashes={data.stashes}
      selectedStash={selectedStash}
      onSelectStash={setSelectedStash}
      onApply={actions.applyStash}
      onPop={actions.popStash}
      onDrop={actions.dropStash}
    />
  </>
);
