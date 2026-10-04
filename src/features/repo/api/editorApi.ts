/**
 * Thin wrapper over the open-in-editor IPC command, so header components
 * launch the external editor without importing `ipc/` directly.
 */
import { invokeCommand } from "../../../ipc/client";

/** Opens `repoPath` in `editor`; `customCommand` is used only for "custom". */
export function openInEditor(
  repoPath: string,
  editor: string,
  customCommand: string
): Promise<void> {
  return invokeCommand.openInEditor(repoPath, editor, editor === "custom" ? customCommand : null);
}
