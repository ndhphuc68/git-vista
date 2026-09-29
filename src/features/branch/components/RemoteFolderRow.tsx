/**
 * One folder row of the remote branch tree: either a remote root (with its
 * prune/edit/delete menu) or an intermediate folder. The recursively
 * rendered children are passed in by the caller.
 */
import React from "react";
import clsx from "clsx";
import { Cloud, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { type RemoteItem } from "../../../ipc/bindings.generated";
import { type SidebarDialog } from "../model/sidebarDialog";
import { RemoteRootMenuToggle } from "./RemoteRootMenuToggle";

export interface RemoteFolderRowProps {
  name: string;
  fullPath: string;
  isExpanded: boolean;
  count: number;
  isRemoteRoot: boolean;
  remoteMenuName: string | null;
  onSetRemoteMenuName: (name: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  remotesList: RemoteItem[];
  onToggle: () => void;
  onOpenDialog: (dialog: SidebarDialog) => void;
  children: React.ReactNode;
}

export const RemoteFolderRow: React.FC<RemoteFolderRowProps> = ({
  name,
  isExpanded,
  count,
  isRemoteRoot,
  remoteMenuName,
  onSetRemoteMenuName,
  menuRef,
  remotesList,
  onToggle,
  onOpenDialog,
  children,
}) => {
  const isRemoteMenuOpen = remoteMenuName === name;

  return (
    <div
      className="group/remote relative flex flex-col mt-0.5"
      onContextMenu={(e) => {
        if (isRemoteRoot) {
          e.preventDefault();
          e.stopPropagation();
          onSetRemoteMenuName(name);
        }
      }}
    >
      <div
        className={clsx(
          "flex items-center justify-between rounded-sm hover:bg-surface-hover group transition-colors pr-1",
          // Marks the remote a right-click or "..." menu is acting on.
          isRemoteMenuOpen && "bg-surface-hover"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-between flex-1 px-2 py-1 text-primary font-semibold text-xs cursor-pointer border-0 bg-transparent text-left truncate"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-secondary group-hover:text-primary">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            {isRemoteRoot ? (
              <Cloud size={13} className="text-sky-500 shrink-0" />
            ) : (
              <Folder size={13} className="text-amber-500 shrink-0 fill-amber-500/20" />
            )}
            <span className="truncate">{name}</span>
          </div>
          <span className="text-[10px] font-mono text-tertiary px-1.5 bg-surface-hover rounded-full ml-1">
            {count}
          </span>
        </button>

        {isRemoteRoot && (
          <RemoteRootMenuToggle
            remoteName={name}
            branchCount={count}
            isMenuOpen={isRemoteMenuOpen}
            remotesList={remotesList}
            menuRef={menuRef}
            onSetRemoteMenuName={onSetRemoteMenuName}
            onOpenDialog={onOpenDialog}
          />
        )}
      </div>

      {isExpanded && (
        <div className="tree-guide border-l border-border-subtle ml-3 pl-2 flex flex-col gap-0.5 mt-0.5">
          {children}
        </div>
      )}
    </div>
  );
};
