import type { FormEvent, RefObject } from "react";
import type { useAddRemote, useRenameRemote, useSetRemoteUrl } from "../api";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { isInvalidRemoteName } from "../model/remoteNameHelpers";
import type { RemoteItem } from "../../../ipc/bindings.generated";
import type { Translations } from "../../../i18n/vi";

export interface AddEditRemoteSubmitContext {
  t: Translations;
  isEdit: boolean;
  initialRemote?: RemoteItem | null;
  name: string;
  fetchUrl: string;
  pushUrl: string;
  useSeparatePush: boolean;
  addRemote: ReturnType<typeof useAddRemote>;
  renameRemote: ReturnType<typeof useRenameRemote>;
  setRemoteUrl: ReturnType<typeof useSetRemoteUrl>;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  fetchUrlInputRef: RefObject<HTMLInputElement | null>;
  onSuccess?: () => void;
  onClose: () => void;
}

/**
 * Validates the trimmed form fields, returning the translated error message
 * to show (and which field to focus) or `null` when the form is valid.
 */
export function validateAddEditRemoteForm(
  t: Translations,
  trimmedName: string,
  trimmedFetch: string
): { message: string; focus: "name" | "fetchUrl" } | null {
  if (!trimmedName) {
    return { message: t.modals.remotes.addModal.errorNameEmpty, focus: "name" };
  }
  if (isInvalidRemoteName(trimmedName)) {
    return { message: t.modals.remotes.addModal.errorNameInvalid, focus: "name" };
  }
  if (!trimmedFetch) {
    return { message: t.modals.remotes.addModal.errorUrlEmpty, focus: "fetchUrl" };
  }
  return null;
}

/**
 * Renames the remote first (if the name changed) and then sets its URLs.
 * Renaming first matters: `setRemoteUrl` addresses the remote by its new
 * name, so reversing the order would set the URL on a remote that no longer
 * exists.
 */
async function submitEditRemote(
  context: AddEditRemoteSubmitContext,
  trimmedName: string,
  trimmedFetch: string,
  trimmedPush: string
): Promise<void> {
  const initialRemote = context.initialRemote!;
  let currentName = initialRemote.name;
  if (trimmedName !== initialRemote.name) {
    await context.renameRemote.mutateAsync({ oldName: initialRemote.name, newName: trimmedName });
    currentName = trimmedName;
  }

  const effectivePush = context.useSeparatePush && trimmedPush ? trimmedPush : null;
  await context.setRemoteUrl.mutateAsync({
    name: currentName,
    fetchUrl: trimmedFetch,
    pushUrl: effectivePush,
  });

  useToastStore
    .getState()
    .showSuccess(context.t.modals.remotes.addModal.editSuccess.replace("{name}", currentName));
}

/** Adds the remote and, if requested, sets a separate push URL. */
async function submitAddRemote(
  context: AddEditRemoteSubmitContext,
  trimmedName: string,
  trimmedFetch: string,
  trimmedPush: string
): Promise<void> {
  await context.addRemote.mutateAsync({ name: trimmedName, url: trimmedFetch });

  if (context.useSeparatePush && trimmedPush && trimmedPush !== trimmedFetch) {
    await context.setRemoteUrl.mutateAsync({
      name: trimmedName,
      fetchUrl: trimmedFetch,
      pushUrl: trimmedPush,
    });
  }

  useToastStore
    .getState()
    .showSuccess(context.t.modals.remotes.addModal.addSuccess.replace("{name}", trimmedName));
}

/** Runs the add-or-edit sequence, then closes the modal and reports success. */
export async function submitAddEditRemoteForm(
  context: AddEditRemoteSubmitContext,
  trimmedName: string,
  trimmedFetch: string,
  trimmedPush: string
): Promise<void> {
  if (context.isEdit && context.initialRemote) {
    await submitEditRemote(context, trimmedName, trimmedFetch, trimmedPush);
  } else {
    await submitAddRemote(context, trimmedName, trimmedFetch, trimmedPush);
  }

  context.onSuccess?.();
  context.onClose();
}

export function mapAddEditRemoteError(err: unknown): string {
  return mapGitError(err).message;
}

/**
 * Builds the modal's form submit handler: validates the trimmed fields,
 * runs the add-or-edit sequence, and manages the loading/error state around
 * it. Moved intact from the hook body.
 */
export function createAddEditRemoteSubmitHandler(context: AddEditRemoteSubmitContext) {
  return async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = context.name.trim();
    const trimmedFetch = context.fetchUrl.trim();
    const trimmedPush = context.pushUrl.trim();

    const validationError = validateAddEditRemoteForm(context.t, trimmedName, trimmedFetch);
    if (validationError) {
      context.setError(validationError.message);
      (validationError.focus === "name"
        ? context.nameInputRef
        : context.fetchUrlInputRef
      ).current?.focus();
      return;
    }

    context.setLoading(true);
    context.setError(null);

    try {
      await submitAddEditRemoteForm(context, trimmedName, trimmedFetch, trimmedPush);
    } catch (err) {
      context.setError(mapAddEditRemoteError(err));
    } finally {
      context.setLoading(false);
    }
  };
}
