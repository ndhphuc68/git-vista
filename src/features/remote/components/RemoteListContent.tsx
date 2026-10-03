import React from "react";
import { Cloud, Plus, Loader2 } from "lucide-react";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";
import { RemoteListItem } from "./RemoteListItem";

export interface RemoteListContentProps {
  remotes: RemoteItem[];
  isLoading: boolean;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onPrune: (remoteName: string) => void;
  onEdit: (remote: RemoteItem) => void;
  onDelete: (remote: RemoteItem) => void;
  onOpenAdd: () => void;
}

/**
 * Loading state, empty state, and the list of `RemoteListItem` cards for
 * `ManageRemotesModal`. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const RemoteListContent: React.FC<RemoteListContentProps> = ({
  remotes,
  isLoading,
  copiedKey,
  onCopy,
  onPrune,
  onEdit,
  onDelete,
  onOpenAdd,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-6 overflow-y-auto flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center py-12 text-secondary gap-2.5">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span className="text-xs">{t.common.loading}</span>
        </div>
      </div>
    );
  }

  if (remotes.length === 0) {
    return (
      <div className="p-6 overflow-y-auto flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="p-4 rounded-full bg-surface-hover text-tertiary">
            <Cloud size={32} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="text-sm font-semibold text-primary">
              {t.modals.remotes.emptyTitle}
            </span>
            <span className="text-xs text-secondary leading-relaxed">
              {t.modals.remotes.emptyDesc}
            </span>
          </div>
          <Button variant="primary" onClick={onOpenAdd} className="mt-2">
            <Plus size={14} />
            <span>{t.modals.remotes.addRemoteBtn}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto flex flex-col gap-3 flex-1 min-h-0">
      {remotes.map((remote) => (
        <RemoteListItem
          key={remote.name}
          remote={remote}
          copiedKey={copiedKey}
          onCopy={onCopy}
          onPrune={onPrune}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
