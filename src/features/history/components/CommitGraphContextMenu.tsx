import type { RefObject } from "react";
import { GitBranch, GitCommit, Tag, Copy, GitPullRequest, RotateCcw, GitMerge, GitCompare } from "lucide-react";
import { useTranslation } from "../../../i18n";
import type { GraphContextMenu, GraphDialog } from "../model/graphDialog";
import { buildCompareDialogFromContextMenu } from "../model/graphDialog";
import { CommitGraphContextMenuItem } from "./CommitGraphContextMenuItem";

interface CommitGraphContextMenuProps {
  contextMenu: GraphContextMenu;
  menuRef: RefObject<HTMLDivElement | null>;
  selectedCommitId: string | null;
  onOpenDialog: (dialog: GraphDialog) => void;
  onClose: () => void;
  onCopySha: (commitId: string) => void;
  onCheckoutCommit: (commitId: string) => void;
}

export function CommitGraphContextMenu({
  contextMenu,
  menuRef,
  selectedCommitId,
  onOpenDialog,
  onClose,
  onCopySha,
  onCheckoutCommit,
}: CommitGraphContextMenuProps) {
  const { t } = useTranslation();
  const { commit } = contextMenu;

  const actions = [
    { icon: Tag, label: t.graph.createTagHere, dialog: { type: "createTag", commit } as const },
    {
      icon: GitBranch,
      label: t.graph.createBranchHere,
      dialog: { type: "createBranch", commit } as const,
    },
    {
      icon: GitPullRequest,
      label: t.graph.cherryPickHere,
      dialog: { type: "cherryPick", commit } as const,
    },
    { icon: RotateCcw, label: t.graph.revertHere, dialog: { type: "revert", commit } as const },
    {
      icon: GitMerge,
      label: t.graph.interactiveRebaseHere,
      dialog: { type: "interactiveRebase", commit } as const,
    },
    {
      icon: GitCompare,
      label: t.graph.compareWith,
      dialog: buildCompareDialogFromContextMenu(contextMenu, selectedCommitId),
    },
  ];

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
      <CommitGraphContextMenuItem
        icon={GitCommit}
        label={t.graph.checkoutCommit}
        onClick={() => {
          onCheckoutCommit(commit.id);
          onClose();
        }}
      />

      {actions.map((action) => (
        <CommitGraphContextMenuItem
          key={action.dialog.type}
          icon={action.icon}
          label={action.label}
          onClick={() => {
            onOpenDialog(action.dialog);
            onClose();
          }}
        />
      ))}

      <CommitGraphContextMenuItem
        icon={Copy}
        label={t.graph.copySha}
        onClick={() => onCopySha(commit.id)}
        className="border-t border-border-subtle/50 mt-1 pt-2"
      />
    </div>
  );
}
