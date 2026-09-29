import { useState } from "react";

/** Visibility state (and matching close callbacks) for the app's global dialogs. */
export function useAppDialogState() {
  const [isGlobalCreateBranchOpen, setIsGlobalCreateBranchOpen] = useState(false);
  const [isManageRemotesOpen, setIsManageRemotesOpen] = useState(false);
  const [isInteractiveRebaseOpen, setIsInteractiveRebaseOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareBaseRev, setCompareBaseRev] = useState<string | undefined>(undefined);
  const [compareTargetRev, setCompareTargetRev] = useState<string | undefined>(undefined);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  return {
    isGlobalCreateBranchOpen,
    setIsGlobalCreateBranchOpen,
    isManageRemotesOpen,
    setIsManageRemotesOpen,
    isInteractiveRebaseOpen,
    setIsInteractiveRebaseOpen,
    isCompareOpen,
    setIsCompareOpen,
    compareBaseRev,
    setCompareBaseRev,
    compareTargetRev,
    setCompareTargetRev,
    isShortcutsHelpOpen,
    setIsShortcutsHelpOpen,
  };
}
