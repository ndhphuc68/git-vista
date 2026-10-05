/**
 * editor IPC commands.
 *
 * Thin wrappers over the generated bindings for launching the user's
 * external editor and terminal.
 */
import { commands } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const editorCommands = {
  openInEditor: async (
    repoPath: string,
    editor: string,
    customCommand: string | null
  ): Promise<void> => {
    // There is no external editor to launch in browser dev mode.
    if (!isTauri()) return;
    unwrap(await commands.openInEditor(repoPath, editor, customCommand));
  },

  openInTerminal: async (repoPath: string, terminal: string): Promise<void> => {
    // There is no terminal to launch in browser dev mode.
    if (!isTauri()) return;
    unwrap(await commands.openInTerminal(repoPath, terminal));
  },
};
