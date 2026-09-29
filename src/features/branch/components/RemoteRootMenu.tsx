/**
 * The dropdown action menu for a remote root: prune, edit and remove.
 */
import React from "react";
import { Scissors, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";
import { findRemoteOrPlaceholder } from "../model/remoteLookup";

export interface RemoteRootMenuProps {
  remoteName: string;
  branchCount: number;
  remotesList: RemoteItem[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSetRemoteMenuName: (name: string | null) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const RemoteRootMenu: React.FC<RemoteRootMenuProps> = ({
  remoteName,
  branchCount,
  remotesList,
  menuRef,
  onSetRemoteMenuName,
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
        onClick={() => {
          onSetRemoteMenuName(null);
          onOpenDialog({ kind: "pruneRemote", remoteName });
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Scissors size={14} className="text-sky-500 shrink-0" />
        <span>{t.sidebar.pruneRemote}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetRemoteMenuName(null);
          onOpenDialog({
            kind: "editRemote",
            remote: findRemoteOrPlaceholder(remotesList, remoteName, branchCount),
          });
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Edit2 size={14} className="text-secondary shrink-0" />
        <span>{t.sidebar.editRemote}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSetRemoteMenuName(null);
          onOpenDialog({
            kind: "deleteRemote",
            remote: findRemoteOrPlaceholder(remotesList, remoteName, branchCount),
          });
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full whitespace-nowrap transition-colors"
      >
        <Trash2 size={14} className="shrink-0" />
        <span>{t.sidebar.removeRemote}</span>
      </button>
    </div>
  );
};
