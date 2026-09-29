/**
 * One row of the TAGS section: the tag summary plus its context menu, opened
 * by right-click or the "..." button.
 */
import React from "react";
import clsx from "clsx";
import { Tag, MoreVertical } from "lucide-react";
import { type TagItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";
import { TagRowMenu } from "./TagRowMenu";

export interface TagRowProps {
  tag: TagItem;
  isMenuOpen: boolean;
  onSetMenuTag: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onCheckoutTag: (tag: TagItem) => void;
  onPushTag: (tag: TagItem) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const TagRow: React.FC<TagRowProps> = ({
  tag,
  isMenuOpen,
  onSetMenuTag,
  menuRef,
  onCheckoutTag,
  onPushTag,
  onOpenDialog,
}) => {
  return (
    <div
      className="group relative flex items-center justify-between rounded-sm"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSetMenuTag(tag.name);
      }}
    >
      <div
        className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm text-secondary hover:text-primary hover:bg-surface-hover text-xs cursor-default transition-colors overflow-hidden min-h-[26px]"
        title={tag.commit_summary || tag.name}
      >
        <Tag size={12} className="text-amber-500 shrink-0" />
        <span className="font-mono truncate">{tag.name}</span>
        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface-hover text-tertiary ml-auto shrink-0">
          {tag.short_commit_id || tag.target_commit_id.slice(0, 7)}
        </span>
      </div>

      {/* Three dots menu button */}
      <div className="relative shrink-0 flex items-center pr-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetMenuTag(isMenuOpen ? null : tag.name);
          }}
          aria-label={`Menu thao tác thẻ ${tag.name}`}
          className={clsx(
            "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <MoreVertical size={13} />
        </button>

        {isMenuOpen && (
          <TagRowMenu
            tag={tag}
            menuRef={menuRef}
            onSetMenuTag={onSetMenuTag}
            onCheckoutTag={onCheckoutTag}
            onPushTag={onPushTag}
            onOpenDialog={onOpenDialog}
          />
        )}
      </div>
    </div>
  );
};
