import type { RemoteItem } from "../../../ipc/bindings.generated";

/** Strips characters Git forbids in a remote name as the user types. */
export function sanitizeRemoteName(value: string): string {
  return value.replace(/[\s~^:?*[\\@{}]/g, "");
}

/** True when `name` starts with a dash or contains a character Git forbids in a remote name. */
export function isInvalidRemoteName(name: string): boolean {
  return name.startsWith("-") || /[\s\0~^:?*[\\]/.test(name);
}

export interface AddEditRemoteFormFields {
  name: string;
  fetchUrl: string;
  useSeparatePush: boolean;
  pushUrl: string;
}

/**
 * Computes the form fields `AddEditRemoteModal` should reset to when it
 * opens: blank for adding a new remote, or prefilled from `initialRemote`
 * when editing one.
 */
export function resolveInitialRemoteFields(
  initialRemote: RemoteItem | null | undefined
): AddEditRemoteFormFields {
  if (!initialRemote) {
    return { name: "", fetchUrl: "", useSeparatePush: false, pushUrl: "" };
  }

  const hasCustomPush =
    Boolean(initialRemote.push_url) && initialRemote.push_url !== initialRemote.fetch_url;
  return {
    name: initialRemote.name,
    fetchUrl: initialRemote.fetch_url || "",
    useSeparatePush: hasCustomPush,
    pushUrl: initialRemote.push_url || "",
  };
}
