import { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n";
import { type GitHubUserSummary } from "../../../ipc/githubApi";
import { createLoadTokenHandler } from "./useGitHubSettings.load";
import {
  createTestAndSaveHandler,
  createUseGhCliHandler,
  createDisconnectHandler,
} from "./useGitHubSettings.actions";

export interface UseGitHubSettingsResult {
  token: string;
  setToken: (value: string) => void;
  showToken: boolean;
  setShowToken: (value: boolean) => void;
  isLoading: boolean;
  isTesting: boolean;
  connectedUser: GitHubUserSummary | null;
  errorMessage: string | null;
  successMessage: string | null;
  handleTestAndSave: () => Promise<void>;
  handleUseGhCli: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

/** Loads, tests, saves, and removes the stored GitHub token for the settings tab. */
export function useGitHubSettings(): UseGitHubSettingsResult {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [connectedUser, setConnectedUser] = useState<GitHubUserSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadToken = createLoadTokenHandler({
      isMounted: () => mounted,
      setToken,
      setConnectedUser,
      setIsLoading,
    });
    loadToken();
    return () => {
      mounted = false;
    };
  }, []);

  const actionsContext = {
    token,
    t,
    setToken,
    setIsTesting,
    setConnectedUser,
    setErrorMessage,
    setSuccessMessage,
  };

  return {
    token,
    setToken,
    showToken,
    setShowToken,
    isLoading,
    isTesting,
    connectedUser,
    errorMessage,
    successMessage,
    handleTestAndSave: createTestAndSaveHandler(actionsContext),
    handleUseGhCli: createUseGhCliHandler(actionsContext),
    handleDisconnect: createDisconnectHandler(actionsContext),
  };
}
