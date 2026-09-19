import React, { useState } from "react";
import {
  Cloud,
  X,
  Plus,
  Scissors,
  Edit2,
  Trash2,
  Copy,
  Check,
  Loader2,
  GitBranch,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { Modal, Button } from "../../shared/ui";
import { AddEditRemoteModal } from "./AddEditRemoteModal";
import { DeleteRemoteModal } from "./DeleteRemoteModal";
import { PruneConfirmModal } from "./PruneConfirmModal";
import type { RemoteItem } from "../../ipc/bindings";
import { qk } from "../../domain/queryKeys";

const TITLE_ID = "manage-remotes-title";

export interface ManageRemotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
}

export const ManageRemotesModal: React.FC<ManageRemotesModalProps> = ({
  isOpen,
  onClose,
  repoPath,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Sub-modal states
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingRemote, setEditingRemote] = useState<RemoteItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRemote, setDeletingRemote] = useState<RemoteItem | null>(null);
  const [pruneOpen, setPruneOpen] = useState(false);
  const [pruningRemoteName, setPruningRemoteName] = useState<string>("");

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const {
    data: remotes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: qk.remotes(repoPath),
    queryFn: () => invokeCommand.getRemotes(repoPath),
    enabled: isOpen && Boolean(repoPath),
  });

  // Escape is handled by Modal. The manual "don't close the parent while a
  // sub-modal is open" guard that used to live here is no longer needed:
  // useEscapeKey's registry only dispatches to the topmost open modal.

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
    // Editing a remote's URL can change its corresponding GitHub owner/repo, so
    // repoInfo's cache must be refreshed too — this used to be a bug where
    // repoInfo went stale after changing the remote.
    queryClient.invalidateQueries({ queryKey: qk.github.repoInfo(repoPath) });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" labelledBy={TITLE_ID}>
        <>
            {/* Header. Kept custom rather than using Modal.Header: this one
                carries a subtitle and an "add remote" action, and widening
                Modal.Header with props for those is the boolean-prop creep
                the compound component exists to avoid. */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-hover/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                  <Cloud size={20} />
                </div>
                <div>
                  <h2
                    id={TITLE_ID}
                    className="text-base font-semibold text-primary m-0"
                  >
                    {t.modals.remotes.title}
                  </h2>
                  <p className="text-xs text-secondary m-0 mt-0.5">{t.modals.remotes.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-0 shadow-xs"
                >
                  <Plus size={14} />
                  <span>{t.modals.remotes.addRemoteBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
                  aria-label={t.common.close}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto flex flex-col gap-3 flex-1 min-h-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-secondary gap-2.5">
                  <Loader2 size={24} className="animate-spin text-accent" />
                  <span className="text-xs">{t.common.loading}</span>
                </div>
              ) : remotes.length === 0 ? (
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
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-0 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>{t.modals.remotes.addRemoteBtn}</span>
                  </button>
                </div>
              ) : (
                remotes.map((remote) => (
                  <div
                    key={remote.name}
                    className="group p-4 bg-window/60 hover:bg-window border border-border-subtle hover:border-border rounded-xl transition-all flex flex-col gap-3"
                  >
                    {/* Top Row: Remote Name & Badges & Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0">
                          <Cloud size={16} />
                        </div>
                        <span className="text-sm font-bold text-primary truncate">
                          {remote.name}
                        </span>
                        {remote.is_default && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                            {t.modals.remotes.defaultBadge}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-hover text-secondary">
                          <GitBranch size={11} />
                          {t.modals.remotes.branchCount.replace(
                            "{count}",
                            String(remote.branch_count)
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Prune */}
                        <button
                          type="button"
                          onClick={() => handleOpenPrune(remote.name)}
                          title={t.modals.remotes.actions.pruneTooltip}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors border-0 cursor-pointer"
                        >
                          <Scissors size={12} />
                          <span>{t.modals.remotes.actions.prune}</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(remote)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-secondary hover:text-primary bg-surface-hover hover:bg-surface border border-border-subtle transition-colors cursor-pointer"
                        >
                          <Edit2 size={12} />
                          <span>{t.modals.remotes.actions.edit}</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(remote)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors border-0 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>{t.modals.remotes.actions.delete}</span>
                        </button>
                      </div>
                    </div>

                    {/* URLs Display */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle/50 text-xs font-mono">
                      {/* Fetch URL */}
                      <div className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-surface/50 border border-border-subtle/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-tertiary shrink-0">
                            {t.modals.remotes.fetchUrlLabel}:
                          </span>
                          <span className="text-secondary truncate select-all">
                            {remote.fetch_url || "—"}
                          </span>
                        </div>
                        {remote.fetch_url && (
                          <button
                            type="button"
                            onClick={() => handleCopy(remote.fetch_url!, `${remote.name}-fetch`)}
                            title={t.modals.remotes.copyUrlTooltip}
                            className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer shrink-0"
                          >
                            {copiedKey === `${remote.name}-fetch` ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Push URL (only if different or specified) */}
                      {remote.push_url && remote.push_url !== remote.fetch_url && (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-surface/50 border border-border-subtle/40">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-tertiary shrink-0">
                              {t.modals.remotes.pushUrlLabel}:
                            </span>
                            <span className="text-secondary truncate select-all">
                              {remote.push_url}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(remote.push_url!, `${remote.name}-push`)}
                            title={t.modals.remotes.copyUrlTooltip}
                            className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer shrink-0"
                          >
                            {copiedKey === `${remote.name}-push` ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

        </>

        <Modal.Footer className="px-6 bg-surface-hover/10">
          <Button variant="secondary" onClick={onClose}>
            {t.common.close}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Embedded Sub-Modals */}
      <AddEditRemoteModal
        isOpen={addEditOpen}
        onClose={() => setAddEditOpen(false)}
        repoPath={repoPath}
        initialRemote={editingRemote}
        onSuccess={refreshData}
      />

      <DeleteRemoteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        repoPath={repoPath}
        remote={deletingRemote}
        onSuccess={refreshData}
      />

      <PruneConfirmModal
        isOpen={pruneOpen}
        onClose={() => setPruneOpen(false)}
        repoPath={repoPath}
        remoteName={pruningRemoteName}
        onSuccess={refreshData}
      />
    </>
  );
};
