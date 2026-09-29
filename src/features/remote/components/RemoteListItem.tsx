import React from "react";
import { GitBranch, Cloud } from "lucide-react";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { RemoteUrlRow } from "./RemoteUrlRow";
import { RemoteListItemActions } from "./RemoteListItemActions";

export interface RemoteListItemProps {
  remote: RemoteItem;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onPrune: (remoteName: string) => void;
  onEdit: (remote: RemoteItem) => void;
  onDelete: (remote: RemoteItem) => void;
}

/**
 * A single remote's card in `ManageRemotesModal`'s list: name, badges,
 * action buttons, and its fetch/push URLs with copy buttons. Extracted from
 * the component body, keeping the same markup verbatim.
 */
export const RemoteListItem: React.FC<RemoteListItemProps> = ({
  remote,
  copiedKey,
  onCopy,
  onPrune,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="group p-4 bg-window/60 hover:bg-window border border-border-subtle hover:border-border rounded-xl transition-all flex flex-col gap-3">
      {/* Top Row: Remote Name & Badges & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0">
            <Cloud size={16} />
          </div>
          <span className="text-sm font-bold text-primary truncate">{remote.name}</span>
          {remote.is_default && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {t.modals.remotes.defaultBadge}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-hover text-secondary">
            <GitBranch size={11} />
            {t.modals.remotes.branchCount.replace("{count}", String(remote.branch_count))}
          </span>
        </div>

        <RemoteListItemActions
          remote={remote}
          onPrune={onPrune}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* URLs Display */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle/50 text-xs font-mono">
        <RemoteUrlRow
          label={t.modals.remotes.fetchUrlLabel}
          url={remote.fetch_url}
          copyKey={`${remote.name}-fetch`}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />

        {/* Push URL (only if different or specified) */}
        {remote.push_url && remote.push_url !== remote.fetch_url && (
          <RemoteUrlRow
            label={t.modals.remotes.pushUrlLabel}
            url={remote.push_url}
            copyKey={`${remote.name}-push`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        )}
      </div>
    </div>
  );
};
