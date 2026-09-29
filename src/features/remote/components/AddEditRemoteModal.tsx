import React from "react";
import { Cloud } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Modal, Button, Alert } from "../../../shared/ui";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useAddEditRemoteForm } from "../hooks/useAddEditRemoteForm";
import { RemoteNameField } from "./RemoteNameField";
import { RemoteFetchUrlField } from "./RemoteFetchUrlField";
import { RemotePushUrlSection } from "./RemotePushUrlSection";

export interface AddEditRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  initialRemote?: RemoteItem | null;
  onSuccess?: () => void;
}

const TITLE_ID = "add-edit-remote-title";

export const AddEditRemoteModal: React.FC<AddEditRemoteModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  initialRemote,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const {
    isEdit,
    name,
    fetchUrl,
    useSeparatePush,
    setUseSeparatePush,
    pushUrl,
    setPushUrl,
    loading,
    error,
    nameInputRef,
    fetchUrlInputRef,
    handleNameChange,
    handleFetchUrlChange,
    handleSubmit,
  } = useAddEditRemoteForm({ isOpen, repoPath, initialRemote, onSuccess, onClose });

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID} stacked>
      <Modal.Header
        title={isEdit ? t.modals.remotes.addModal.editTitle : t.modals.remotes.addModal.title}
        onClose={onClose}
        titleId={TITLE_ID}
        icon={Cloud}
      />

      {/* The form wraps Body and Footer so the submit button and Enter both
          still submit, the way they did before the migration. */}
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="gap-4">
          {error && <Alert variant="error">{error}</Alert>}

          <RemoteNameField
            name={name}
            onNameChange={handleNameChange}
            isEdit={isEdit}
            loading={loading}
            nameInputRef={nameInputRef}
          />

          <RemoteFetchUrlField
            fetchUrl={fetchUrl}
            onFetchUrlChange={handleFetchUrlChange}
            isEdit={isEdit}
            loading={loading}
            fetchUrlInputRef={fetchUrlInputRef}
          />

          <RemotePushUrlSection
            useSeparatePush={useSeparatePush}
            onUseSeparatePushChange={(checked) => {
              setUseSeparatePush(checked);
              if (!checked) setPushUrl("");
            }}
            pushUrl={pushUrl}
            onPushUrlChange={setPushUrl}
            loading={loading}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim() || !fetchUrl.trim()}>
            {loading
              ? t.modals.remotes.addModal.saving
              : isEdit
                ? t.modals.remotes.addModal.submitEdit
                : t.modals.remotes.addModal.submitAdd}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
