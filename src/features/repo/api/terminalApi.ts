/**
 * Thin wrapper over the open-in-terminal IPC command, so header components
 * launch the terminal without importing `ipc/` directly.
 */
import { invokeCommand } from "../../../ipc/client";

/** Opens `repoPath` in `terminal` (one of the terminals offered in Settings › Tools). */
export function openInTerminal(repoPath: string, terminal: string): Promise<void> {
  return invokeCommand.openInTerminal(repoPath, terminal);
}
