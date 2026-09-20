import type { RefObject } from "react";
import {
  GitBranch,
  Tag,
  Copy,
  GitPullRequest,
  RotateCcw,
  GitMerge,
  GitCompare,
} from "lucide-react";
import { useTranslation } from "../../../i18n";
import type { GraphContextMenu, GraphDialog } from "../model/graphDialog";

interface CommitGraphContextMenuProps {
  contextMenu: GraphContextMenu;
  menuRef: RefObject<HTMLDivElement | null>;
  selectedCommitId: string | null;
  onOpenDialog: (dialog: GraphDialog) => void;
  onClose: () => void;
  onCopySha: (commitId: string) => void;
}

export function CommitGraphContextMenu({
  contextMenu,
  menuRef,
  selectedCommitId,
  onOpenDialog,
  onClose,
  onCopySha,
}: CommitGraphContextMenuProps) {
  const { t } = useTranslation();
  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: `${contextMenu.y}px`,
        left: `${contextMenu.x}px`,
        zIndex: 50,
      }}
      className="min-w-56 w-max bg-surface border border-border-subtle rounded-lg shadow-2xl py-1.5 text-xs flex flex-col animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDialog({ type: "createTag", commit: contextMenu.commit });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <Tag size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.createTagHere}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDialog({ type: "createBranch", commit: contextMenu.commit });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <GitBranch size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.createBranchHere}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDialog({ type: "cherryPick", commit: contextMenu.commit });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <GitPullRequest size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.cherryPickHere}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDialog({ type: "revert", commit: contextMenu.commit });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <RotateCcw size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.revertHere}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenDialog({ type: "interactiveRebase", commit: contextMenu.commit });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <GitMerge size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.interactiveRebaseHere}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          const base =
            selectedCommitId && selectedCommitId !== contextMenu.commit.id
              ? selectedCommitId
              : contextMenu.commit.id;
          const target =
            selectedCommitId && selectedCommitId !== contextMenu.commit.id
              ? contextMenu.commit.id
              : "HEAD";
          onOpenDialog({ type: "compare", baseRev: base, targetRev: target });
          onClose();
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
      >
        <GitCompare size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.compareWith}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => onCopySha(contextMenu.commit.id)}
        className="flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-accent cursor-pointer whitespace-nowrap transition-colors border-t border-border-subtle/50 mt-1 pt-2"
      >
        <Copy size={14} className="shrink-0 text-secondary" />
        <span>{t.graph.copySha}</span>
      </button>
    </div>
  );
}
