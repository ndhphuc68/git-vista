/**
 * The collapsible TAGS section of the branch sidebar: the header with its
 * create-tag button, and the tag rows with their per-tag action menu.
 *
 * Presentational — checkout/push run through callbacks so the sidebar keeps
 * owning the IPC calls and the dialog slot.
 */
import React from "react";
import clsx from "clsx";
import {
  Tag,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  Check,
  Trash2,
  GitBranch,
  Cloud,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type TagItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";

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
            tags.map((tag) => {
              const isMenuOpen = openMenuTag === tag.name;
              return (
                <div
                  key={tag.name}
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
                        isMenuOpen
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                      )}
                    >
                      <MoreVertical size={13} />
                    </button>

                    {/* Dropdown Action Menu */}
                    {isMenuOpen && (
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
                            onOpenDialog({
                              kind: "createBranch",
                              fromRef: tag.target_commit_id,
                            });
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
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
