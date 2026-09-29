import { getGitHubToken, saveGitHubToken, removeGitHubToken } from "../../../features/github";
import { testGitHubToken } from "../../../services/githubService";
import { type GitHubUserSummary } from "../../../ipc/githubApi";
import { messageOf } from "../../../shared/utils/toError";
import type { Translations } from "../../../i18n/vi";

export interface GitHubSettingsActionsContext {
  token: string;
  t: Translations;
  setToken: (value: string) => void;
  setIsTesting: (value: boolean) => void;
  setConnectedUser: (value: GitHubUserSummary | null) => void;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
}

/** Tests the entered token against the GitHub API and persists it on success. */
export function createTestAndSaveHandler(context: GitHubSettingsActionsContext) {
  const { token, t, setIsTesting, setConnectedUser, setErrorMessage, setSuccessMessage } = context;
  return async () => {
    if (!token.trim()) {
      setErrorMessage(t.settings.github.noToken);
      return;
    }
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await testGitHubToken(token.trim());
      await saveGitHubToken(token.trim());
      setConnectedUser(user);
      setSuccessMessage(t.settings.github.connectionSuccess);
    } catch (err: unknown) {
      setErrorMessage(messageOf(err) || "Không thể xác thực token với GitHub.");
      setConnectedUser(null);
    } finally {
      setIsTesting(false);
    }
  };
}

/** Pulls a token from the GitHub CLI (`gh auth token`) and persists it on success. */
export function createUseGhCliHandler(context: GitHubSettingsActionsContext) {
  const { t, setToken, setIsTesting, setConnectedUser, setErrorMessage, setSuccessMessage } =
    context;
  return async () => {
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const cliToken = await getGitHubToken();
      if (!cliToken) {
        setErrorMessage("Không tìm thấy phiên đăng nhập GitHub CLI (gh auth token).");
        return;
      }
      setToken(cliToken);
      const user = await testGitHubToken(cliToken);
      await saveGitHubToken(cliToken);
      setConnectedUser(user);
      setSuccessMessage(t.settings.github.connectionSuccess);
    } catch (err: unknown) {
      setErrorMessage(messageOf(err) || "Không thể lấy token từ GitHub CLI.");
    } finally {
      setIsTesting(false);
    }
  };
}

/** Removes the stored GitHub token and clears connection state. */
export function createDisconnectHandler(context: GitHubSettingsActionsContext) {
  const { t, setToken, setConnectedUser, setErrorMessage, setSuccessMessage } = context;
  return async () => {
    try {
      await removeGitHubToken();
      setToken("");
      setConnectedUser(null);
      setSuccessMessage(t.settings.github.tokenRemoved);
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage(messageOf(err) || "Lỗi khi gỡ bỏ token.");
    }
  };
}
