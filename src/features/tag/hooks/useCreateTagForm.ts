import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { useCreateTag } from "../api";
import { sanitizeTagName } from "../model/tagNameHelpers";

export interface UseCreateTagFormOptions {
  isOpen: boolean;
  repoPath: string;
  targetCommitId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

/**
 * State, reset-on-open effect, and submit handling for `CreateTagModal`.
 * Moved intact from the component body.
 */
export function useCreateTagForm({
  isOpen,
  repoPath,
  targetCommitId,
  onSuccess,
  onClose,
}: UseCreateTagFormOptions) {
  const { t } = useTranslation();
  const createTag = useCreateTag(repoPath);
  const [name, setName] = useState("");
  const [isAnnotated, setIsAnnotated] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsAnnotated(false);
      setMessage("");
      setError(null);
    }
  }, [isOpen]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTagName(e.target.value);
    setName(sanitized);
    if (error) setError(null);
  };

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.modals.createTag.errorEmpty);
      return;
    }

    if (isAnnotated && !message.trim()) {
      setError(t.modals.createTag.errorEmptyMessage);
      return;
    }

    setError(null);

    try {
      await createTag.mutateAsync({
        name: trimmedName,
        targetCommitId,
        message: isAnnotated ? message : undefined,
      });
      useToastStore.getState().showToast({
        message: t.modals.createTag.successToast.replace("{name}", trimmedName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  return {
    createTag,
    name,
    isAnnotated,
    setIsAnnotated,
    message,
    error,
    handleNameChange,
    handleMessageChange,
    handleSubmit,
  };
}
