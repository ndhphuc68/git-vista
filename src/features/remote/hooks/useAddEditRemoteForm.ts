import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../../i18n";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import { useAddRemote, useRenameRemote, useSetRemoteUrl } from "../api";
import { resolveInitialRemoteFields, sanitizeRemoteName } from "../model/remoteNameHelpers";
import { createAddEditRemoteSubmitHandler } from "./useAddEditRemoteForm.actions";

export interface UseAddEditRemoteFormOptions {
  isOpen: boolean;
  repoPath: string;
  initialRemote?: RemoteItem | null;
  onSuccess?: () => void;
  onClose: () => void;
}

/**
 * State, reset-on-open effect, and submit handling for `AddEditRemoteModal`.
 * Moved intact from the component body; the submit sequence itself (which
 * fields to validate, and the rename-then-set-url vs. add-then-set-url
 * mutation order) lives in `useAddEditRemoteForm.actions`.
 */
export function useAddEditRemoteForm({
  isOpen,
  repoPath,
  initialRemote,
  onSuccess,
  onClose,
}: UseAddEditRemoteFormOptions) {
  const { t } = useTranslation();
  const isEdit = Boolean(initialRemote);

  const [name, setName] = useState("");
  const [fetchUrl, setFetchUrl] = useState("");
  const [useSeparatePush, setUseSeparatePush] = useState(false);
  const [pushUrl, setPushUrl] = useState("");
  // A real useState rather than mutation.isPending: the submit is a sequence
  // of up to two mutateAsync calls (rename then setUrl, or add then setUrl),
  // and the button must stay disabled across the whole sequence, not flicker
  // enabled between the two awaits.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRemote = useAddRemote(repoPath);
  const renameRemote = useRenameRemote(repoPath);
  const setRemoteUrl = useSetRemoteUrl(repoPath);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fetchUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fields = resolveInitialRemoteFields(initialRemote);
      setName(fields.name);
      setFetchUrl(fields.fetchUrl);
      setUseSeparatePush(fields.useSeparatePush);
      setPushUrl(fields.pushUrl);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialRemote]);

  const handleNameChange = (value: string) => {
    setName(sanitizeRemoteName(value));
    if (error) setError(null);
  };

  const handleFetchUrlChange = (value: string) => {
    setFetchUrl(value);
    if (error) setError(null);
  };

  const handleSubmit = createAddEditRemoteSubmitHandler({
    t,
    isEdit,
    initialRemote,
    name,
    fetchUrl,
    pushUrl,
    useSeparatePush,
    addRemote,
    renameRemote,
    setRemoteUrl,
    setError,
    setLoading,
    nameInputRef,
    fetchUrlInputRef,
    onSuccess,
    onClose,
  });

  return {
    isEdit,
    name,
    fetchUrl,
    useSeparatePush,
    setUseSeparatePush,
    pushUrl,
    setPushUrl,
    loading,
    error,
    setError,
    nameInputRef,
    fetchUrlInputRef,
    handleNameChange,
    handleFetchUrlChange,
    handleSubmit,
  };
}
