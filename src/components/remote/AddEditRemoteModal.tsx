import React, { useState, useEffect, useRef } from "react";
import { Cloud } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Modal, Button, Alert } from "../../shared/ui";
import type { RemoteItem } from "../../ipc/bindings.generated";

export interface AddEditRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  initialRemote?: RemoteItem | null;
  onSuccess?: () => void;
}

const TITLE_ID = "add-edit-remote-title";

const INPUT_CLASS =
  "px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary " +
  "placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 " +
  "focus:ring-accent/20 transition-all font-mono";

export const AddEditRemoteModal: React.FC<AddEditRemoteModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  initialRemote,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isEdit = Boolean(initialRemote);

  const [name, setName] = useState("");
  const [fetchUrl, setFetchUrl] = useState("");
  const [useSeparatePush, setUseSeparatePush] = useState(false);
  const [pushUrl, setPushUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fetchUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialRemote) {
        setName(initialRemote.name);
        setFetchUrl(initialRemote.fetch_url || "");
        const hasCustomPush =
          Boolean(initialRemote.push_url) && initialRemote.push_url !== initialRemote.fetch_url;
        setUseSeparatePush(hasCustomPush);
        setPushUrl(initialRemote.push_url || "");
      } else {
        setName("");
        setFetchUrl("");
        setUseSeparatePush(false);
        setPushUrl("");
      }
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialRemote]);

  const sanitizeRemoteName = (val: string) => {
    return val.replace(/[\s~^:?*[\\@{}]/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedFetch = fetchUrl.trim();
    const trimmedPush = pushUrl.trim();

    if (!trimmedName) {
      setError(t.modals.remotes.addModal.errorNameEmpty);
      nameInputRef.current?.focus();
      return;
    }

    if (trimmedName.startsWith("-") || /[\s\0~^:?*[\\]/.test(trimmedName)) {
      setError(t.modals.remotes.addModal.errorNameInvalid);
      nameInputRef.current?.focus();
      return;
    }

    if (!trimmedFetch) {
      setError(t.modals.remotes.addModal.errorUrlEmpty);
      fetchUrlInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && initialRemote) {
        let currentName = initialRemote.name;
        if (trimmedName !== initialRemote.name) {
          await invokeCommand.renameRemote(repoPath, initialRemote.name, trimmedName);
          currentName = trimmedName;
        }

        const effectivePush = useSeparatePush && trimmedPush ? trimmedPush : null;
        await invokeCommand.setRemoteUrl(repoPath, currentName, trimmedFetch, effectivePush);

        useToastStore
          .getState()
          .showSuccess(t.modals.remotes.addModal.editSuccess.replace("{name}", currentName));
      } else {
        await invokeCommand.addRemote(repoPath, trimmedName, trimmedFetch);

        if (useSeparatePush && trimmedPush && trimmedPush !== trimmedFetch) {
          await invokeCommand.setRemoteUrl(repoPath, trimmedName, trimmedFetch, trimmedPush);
        }

        useToastStore
          .getState()
          .showSuccess(t.modals.remotes.addModal.addSuccess.replace("{name}", trimmedName));
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(mapGitError(err).message);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Remote Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="remote-name-input" className="text-xs font-semibold text-primary">
              {t.modals.remotes.addModal.nameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              id="remote-name-input"
              ref={nameInputRef}
              type="text"
              // When editing, the name is already filled in, so focus starts
              // on the URL — the field the user actually came to change.
              {...(isEdit ? {} : { "data-autofocus": true })}
              value={name}
              onChange={(e) => {
                setName(sanitizeRemoteName(e.target.value));
                if (error) setError(null);
              }}
              placeholder={t.modals.remotes.addModal.namePlaceholder}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>

          {/* Fetch URL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="remote-fetch-url-input" className="text-xs font-semibold text-primary">
              {t.modals.remotes.addModal.fetchUrlLabel} <span className="text-red-500">*</span>
            </label>
            <input
              id="remote-fetch-url-input"
              ref={fetchUrlInputRef}
              type="text"
              {...(isEdit ? { "data-autofocus": true } : {})}
              value={fetchUrl}
              onChange={(e) => {
                setFetchUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.modals.remotes.addModal.fetchUrlPlaceholder}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>

          {/* Custom Push URL Checkbox */}
          <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle/50">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-primary">
              <input
                type="checkbox"
                checked={useSeparatePush}
                onChange={(e) => {
                  setUseSeparatePush(e.target.checked);
                  if (!e.target.checked) setPushUrl("");
                }}
                disabled={loading}
                className="rounded border-border-subtle text-accent focus:ring-accent"
              />
              <span>{t.modals.remotes.addModal.separatePushUrl}</span>
            </label>

            {useSeparatePush && (
              <div className="flex flex-col gap-1.5 pl-6 animate-fade-in">
                <label
                  htmlFor="remote-push-url-input"
                  className="text-xs font-medium text-secondary"
                >
                  {t.modals.remotes.addModal.pushUrlLabel}
                </label>
                <input
                  id="remote-push-url-input"
                  type="text"
                  value={pushUrl}
                  onChange={(e) => setPushUrl(e.target.value)}
                  placeholder={t.modals.remotes.addModal.pushUrlPlaceholder}
                  disabled={loading}
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!name.trim() || !fetchUrl.trim()}
          >
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
