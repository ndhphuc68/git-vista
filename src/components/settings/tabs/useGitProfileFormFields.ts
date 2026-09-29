import { useState } from "react";

export interface UseGitProfileFormFieldsResult {
  userName: string;
  setUserName: (value: string) => void;
  userEmail: string;
  setUserEmail: (value: string) => void;
  defaultBranch: string;
  setDefaultBranch: (value: string) => void;
  gpgSign: boolean;
  setGpgSign: (value: boolean) => void;
  gpgKey: string;
  setGpgKey: (value: string) => void;
}

/** Editable identity/GPG fields for the git profile form. */
export function useGitProfileFormFields(): UseGitProfileFormFieldsResult {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [gpgSign, setGpgSign] = useState(false);
  const [gpgKey, setGpgKey] = useState("");

  return {
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    defaultBranch,
    setDefaultBranch,
    gpgSign,
    setGpgSign,
    gpgKey,
    setGpgKey,
  };
}
