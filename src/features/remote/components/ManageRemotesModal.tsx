import React from "react";
import { useTranslation } from "../../../i18n";
import { Modal, Button } from "../../../shared/ui";
import { AddEditRemoteModal } from "./AddEditRemoteModal";
import { DeleteRemoteModal } from "./DeleteRemoteModal";
import { PruneConfirmModal } from "./PruneConfirmModal";
import { ManageRemotesHeader } from "./ManageRemotesHeader";
import { RemoteListContent } from "./RemoteListContent";
import { useManageRemotesModal } from "../hooks/useManageRemotesModal";

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
  const {
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
  } = useManageRemotesModal(repoPath);

  // Escape is handled by Modal. The manual "don't close the parent while a
  // sub-modal is open" guard that used to live here is no longer needed:
  // useEscapeKey's registry only dispatches to the topmost open modal.

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" labelledBy={TITLE_ID}>
        <>
          <ManageRemotesHeader onClose={onClose} onOpenAdd={handleOpenAdd} titleId={TITLE_ID} />

          <RemoteListContent
            remotes={remotes}
            isLoading={isLoading}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onPrune={handleOpenPrune}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onOpenAdd={handleOpenAdd}
          />
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
