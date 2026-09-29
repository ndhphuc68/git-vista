/**
 * The collapsible TAGS section of the branch sidebar: the header with its
 * create-tag button, and the tag rows with their per-tag action menu.
 *
 * Presentational — checkout/push run through callbacks so the sidebar keeps
 * owning the IPC calls and the dialog slot.
 */
import React from "react";
import { Tag, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type TagItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";
import { TagRow } from "./TagRow";

export interface TagSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Already filtered by the sidebar's search box. */
  tags: TagItem[];
  /** Total tag count for the header — deliberately NOT the filtered length. */
  totalTagCount: number;
  /** Commit a tag created from this header points at (HEAD). */
  headCommitId: string;
  openMenuTag: string | null;
  onSetMenuTag: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onCheckoutTag: (tag: TagItem) => void;
  onPushTag: (tag: TagItem) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const TagSection: React.FC<TagSectionProps> = ({
  isOpen,
  onToggle,
  tags,
  totalTagCount,
  headCommitId,
  openMenuTag,
  onSetMenuTag,
  menuRef,
  onCheckoutTag,
  onPushTag,
  onOpenDialog,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => onToggle()}
          aria-expanded={isOpen}
          aria-label={t.sidebar.tags}
          className="flex items-center gap-1.5 flex-1 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <Tag size={13} />
          <span>
            {t.sidebar.tags} ({totalTagCount})
          </span>
        </button>
        <button
          type="button"
          title={t.sidebar.createTagTitle}
          aria-label={t.sidebar.createTagTitle}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDialog({ kind: "createTag", commitId: headCommitId, summary: "HEAD" });
          }}
          className="p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
        >
          <Plus size={13} />
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-0.5 mt-1">
          {tags.length === 0 ? (
            <div className="px-2 py-1 text-xs text-tertiary italic">{t.sidebar.emptyTags}</div>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.name}
                tag={tag}
                isMenuOpen={openMenuTag === tag.name}
                onSetMenuTag={onSetMenuTag}
                menuRef={menuRef}
                onCheckoutTag={onCheckoutTag}
                onPushTag={onPushTag}
                onOpenDialog={onOpenDialog}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
