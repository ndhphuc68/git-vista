import { openInEditor } from "../../features/repo";
import { type Translations } from "../../i18n/vi";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { toErrorMessage } from "../../shared/utils/toError";

function isNotFoundError(err: unknown): err is { type: "NotFound"; message: string } {
  return typeof err === "object" && err !== null && (err as { type?: unknown }).type === "NotFound";
}

/** Opens the repo in the editor chosen in Settings › Tools, reporting failures as a toast. */
export async function openRepoInEditor(repoPath: string, t: Translations): Promise<void> {
  const { defaultEditor, customEditorCommand } = useSettingsStore.getState();
  try {
    await openInEditor(repoPath, defaultEditor, customEditorCommand);
  } catch (err) {
    const message = isNotFoundError(err)
      ? t.header.editorNotFound.replace("{program}", err.message)
      : toErrorMessage(err);
    useToastStore.getState().showError(message);
  }
}
