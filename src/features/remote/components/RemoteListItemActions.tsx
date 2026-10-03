import React from "react";
import { Scissors, Edit2, Trash2 } from "lucide-react";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

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
      <Button
        variant="secondary"
        onClick={() => onPrune(remote.name)}
        title={t.modals.remotes.actions.pruneTooltip}
      >
        <Scissors size={12} />
        <span>{t.modals.remotes.actions.prune}</span>
      </Button>

      {/* Edit */}
      <Button variant="secondary" onClick={() => onEdit(remote)}>
        <Edit2 size={12} />
        <span>{t.modals.remotes.actions.edit}</span>
      </Button>

      {/* Delete */}
      <Button variant="danger" onClick={() => onDelete(remote)}>
        <Trash2 size={12} />
        <span>{t.modals.remotes.actions.delete}</span>
      </Button>
    </div>
  );
};
