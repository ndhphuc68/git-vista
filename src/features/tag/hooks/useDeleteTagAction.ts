import { useEffect, useState } from "react";
import { useTranslation } from "../../../i18n";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { useDeleteTag } from "../api";
import { toErrorMessage } from "../../../shared/utils/toError";

export interface UseDeleteTagActionOptions {
  isOpen: boolean;
  repoPath: string;
  tagName: string;
  onSuccess?: () => void;
  onClose: () => void;
}

/**
 * State, reset-on-open effect, and submit handler for `DeleteTagModal`.
 * Moved intact from the component body.
 */
export function useDeleteTagAction({
  isOpen,
  repoPath,
  tagName,
  onSuccess,
  onClose,
}: UseDeleteTagActionOptions) {
  const { t } = useTranslation();
  const deleteTag = useDeleteTag(repoPath);
  const [deleteRemote, setDeleteRemote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeleteRemote(false);
      setError(null);
    }
  }, [isOpen, tagName]);

  const handleDelete = async () => {
    setError(null);

    try {
      await deleteTag.mutateAsync({ name: tagName, deleteRemote });
      useToastStore.getState().showToast({
        message: t.modals.deleteTag.successToast.replace("{name}", tagName),
        type: "success",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(t.modals.deleteTag.errorGeneric.replace("{msg}", msg));
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  return { deleteTag, deleteRemote, setDeleteRemote, error, handleDelete };
}
