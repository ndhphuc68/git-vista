import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { qk } from "../../../domain/queryKeys";
import { useRemotes } from "../api";

/**
 * Sub-modal open/close state, copy-to-clipboard feedback, and the remotes
 * list query for `ManageRemotesModal`. Moved intact from the component body.
 */
export function useManageRemotesModal(repoPath: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingRemote, setEditingRemote] = useState<RemoteItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRemote, setDeletingRemote] = useState<RemoteItem | null>(null);
  const [pruneOpen, setPruneOpen] = useState(false);
  const [pruningRemoteName, setPruningRemoteName] = useState<string>("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: remotes = [], isLoading, refetch } = useRemotes(repoPath);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    useToastStore.getState().showToast({ type: "info", message: t.modals.remotes.copiedToast });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingRemote(null);
    setAddEditOpen(true);
  };

  const handleOpenEdit = (remote: RemoteItem) => {
    setEditingRemote(remote);
    setAddEditOpen(true);
  };

  const handleOpenDelete = (remote: RemoteItem) => {
    setDeletingRemote(remote);
    setDeleteOpen(true);
  };

  const handleOpenPrune = (remoteName: string) => {
    setPruningRemoteName(remoteName);
    setPruneOpen(true);
  };

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: qk.remotes(repoPath) });
    queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
    // GitHub repo info is derived from the remote URL, so it goes stale when a
    // remote changes. Only this modal needs it — the shared hook stays narrow.
    queryClient.invalidateQueries({ queryKey: qk.github.repoInfo(repoPath) });
  };

  return {
    remotes,
    isLoading,
    copiedKey,
    handleCopy,
    addEditOpen,
    setAddEditOpen,
    editingRemote,
    handleOpenAdd,
    handleOpenEdit,
    deleteOpen,
    setDeleteOpen,
    deletingRemote,
    handleOpenDelete,
    pruneOpen,
    setPruneOpen,
    pruningRemoteName,
    handleOpenPrune,
    refreshData,
  };
}
