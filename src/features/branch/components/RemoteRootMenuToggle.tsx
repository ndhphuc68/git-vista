/**
 * The "..." button and dropdown for a remote root row's prune/edit/delete
 * menu. Split out of RemoteFolderRow to keep that row's own function under
 * the line limit.
 */
import React from "react";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";
import { RemoteRootMenu } from "./RemoteRootMenu";

export interface RemoteRootMenuToggleProps {
  remoteName: string;
  branchCount: number;
  isMenuOpen: boolean;
  remotesList: RemoteItem[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSetRemoteMenuName: (name: string | null) => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
}

export const RemoteRootMenuToggle: React.FC<RemoteRootMenuToggleProps> = ({
  remoteName,
  branchCount,
  isMenuOpen,
  remotesList,
  menuRef,
  onSetRemoteMenuName,
  onOpenDialog,
}) => (
  <div className="relative shrink-0 flex items-center">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSetRemoteMenuName(isMenuOpen ? null : remoteName);
      }}
      aria-label={`Menu thao tác remote ${remoteName}`}
      className={clsx(
        "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
        isMenuOpen ? "opacity-100" : "opacity-0 group-hover/remote:opacity-100 focus:opacity-100"
      )}
    >
      <MoreVertical size={13} />
    </button>

    {isMenuOpen && (
      <RemoteRootMenu
        remoteName={remoteName}
        branchCount={branchCount}
        remotesList={remotesList}
        menuRef={menuRef}
        onSetRemoteMenuName={onSetRemoteMenuName}
        onOpenDialog={onOpenDialog}
      />
    )}
  </div>
);
