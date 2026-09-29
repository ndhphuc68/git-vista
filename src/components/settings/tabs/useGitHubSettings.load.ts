import { getGitHubToken } from "../../../features/github";
import { testGitHubToken } from "../../../services/githubService";
import { type GitHubUserSummary } from "../../../ipc/githubApi";

export interface GitHubSettingsLoadContext {
  isMounted: () => boolean;
  setToken: (value: string) => void;
  setConnectedUser: (value: GitHubUserSummary | null) => void;
  setIsLoading: (value: boolean) => void;
}

/** Loads a stored GitHub token on mount and verifies it against the API. */
export function createLoadTokenHandler(context: GitHubSettingsLoadContext) {
  const { isMounted, setToken, setConnectedUser, setIsLoading } = context;
  return async () => {
    try {
      const existing = await getGitHubToken();
      if (!isMounted()) return;
      if (existing) {
        setToken(existing);
        try {
          const user = await testGitHubToken(existing);
          if (isMounted()) setConnectedUser(user);
        } catch {
          // Token might be invalid or expired
        }
      }
    } catch (err) {
      console.error("Error loading GitHub token:", err);
    } finally {
      if (isMounted()) setIsLoading(false);
    }
  };
}
