import React from "react";
import { Scissors, Edit2, Trash2 } from "lucide-react";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";

export interface RemoteListItemActionsProps {
  remote: RemoteItem;
  onPrune: (remoteName: string) => void;
  onEdit: (remote: RemoteItem) => void;
  onDelete: (remote: RemoteItem) => void;
}

/**
 * Prune / edit / delete action buttons for a `RemoteListItem` card.
 * Extracted from the component body, keeping the same markup verbatim.
 */
export const RemoteListItemActions: React.FC<RemoteListItemActionsProps> = ({
  remote,
  onPrune,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Prune */}
      <button
        type="button"
        onClick={() => onPrune(remote.name)}
        title={t.modals.remotes.actions.pruneTooltip}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors border-0 cursor-pointer"
      >
        <Scissors size={12} />
        <span>{t.modals.remotes.actions.prune}</span>
      </button>

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(remote)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-secondary hover:text-primary bg-surface-hover hover:bg-surface border border-border-subtle transition-colors cursor-pointer"
      >
        <Edit2 size={12} />
        <span>{t.modals.remotes.actions.edit}</span>
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(remote)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors border-0 cursor-pointer"
      >
        <Trash2 size={12} />
        <span>{t.modals.remotes.actions.delete}</span>
      </button>
    </div>
  );
};
