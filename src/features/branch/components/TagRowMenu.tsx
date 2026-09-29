/**
 * The dropdown action menu for one tag row: checkout, create branch from tag,
 * push and delete.
 */
import React from "react";
import { Check, GitBranch, Cloud, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type TagItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";

export interface TagRowMenuProps {
  tag: TagItem;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSetMenuTag: (name: string | null) => void;
  onCheckoutTag: (tag: TagItem) => void;
  onPushTag: (tag: TagItem) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const TagRowMenu: React.FC<TagRowMenuProps> = ({
  tag,
  menuRef,
  onSetMenuTag,
  onCheckoutTag,
  onPushTag,
  onOpenDialog,
}) => {
  const { t } = useTranslation();

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 z-50 text-xs flex flex-col animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onCheckoutTag(tag)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Check size={14} className="text-accent shrink-0" />
        <span>{t.sidebar.checkoutTag}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetMenuTag(null);
          onOpenDialog({ kind: "createBranch", fromRef: tag.target_commit_id });
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <GitBranch size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.createBranchFromTag}</span>
      </button>

      <button
        type="button"
        onClick={() => onPushTag(tag)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Cloud size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.pushTag}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetMenuTag(null);
          onOpenDialog({ kind: "deleteTag", tag });
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Trash2 size={14} className="shrink-0" />
        <span>{t.sidebar.deleteTag}</span>
      </button>
    </div>
  );
};
