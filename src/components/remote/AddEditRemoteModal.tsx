import React, { useState, useEffect, useRef } from "react";
import { Cloud, X, AlertCircle, Loader2 } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { Transition } from "../common/Transition";
import type { RemoteItem } from "../../ipc/bindings";

export interface AddEditRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  initialRemote?: RemoteItem | null;
  onSuccess?: () => void;
}

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
        setTimeout(() => fetchUrlInputRef.current?.focus(), 50);
      } else {
        setName("");
        setFetchUrl("");
        setUseSeparatePush(false);
        setPushUrl("");
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialRemote]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    <Transition show={isOpen} duration={150}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-edit-remote-title"
      >
        <div
          className="relative w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-hover/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Cloud size={18} />
              </div>
              <div>
                <h3 id="add-edit-remote-title" className="text-sm font-semibold text-primary m-0">
                  {isEdit ? t.modals.remotes.addModal.editTitle : t.modals.remotes.addModal.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
              aria-label={t.common.close}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Remote Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="remote-name-input" className="text-xs font-semibold text-primary">
                {t.modals.remotes.addModal.nameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                id="remote-name-input"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(sanitizeRemoteName(e.target.value));
                  if (error) setError(null);
                }}
                placeholder={t.modals.remotes.addModal.namePlaceholder}
                disabled={loading}
                className="px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-mono"
              />
            </div>

            {/* Fetch URL */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="remote-fetch-url-input"
                className="text-xs font-semibold text-primary"
              >
                {t.modals.remotes.addModal.fetchUrlLabel} <span className="text-red-500">*</span>
              </label>
              <input
                id="remote-fetch-url-input"
                ref={fetchUrlInputRef}
                type="text"
                value={fetchUrl}
                onChange={(e) => {
                  setFetchUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t.modals.remotes.addModal.fetchUrlPlaceholder}
                disabled={loading}
                className="px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-mono"
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
                    className="px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-transparent text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !fetchUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {loading
                    ? t.modals.remotes.addModal.saving
                    : isEdit
                      ? t.modals.remotes.addModal.submitEdit
                      : t.modals.remotes.addModal.submitAdd}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  );
};
