import React from "react";
import { CreateStashModal, type useSaveStash } from "../../features/stash";

export interface ChangesStashModalProps {
  isOpen: boolean;
  repoPath: string;
  saveStash: ReturnType<typeof useSaveStash>;
  onClose: () => void;
}

/** Wires the shared `CreateStashModal` to the changes screen's save-stash mutation. */
export const ChangesStashModal: React.FC<ChangesStashModalProps> = ({
  isOpen,
  repoPath,
  saveStash,
  onClose,
}) => (
  <CreateStashModal
    isOpen={isOpen}
    onClose={onClose}
    repoPath={repoPath}
    onSaveStash={async (message, includeUntracked) => {
      // useSaveStash invalidates qk.repo.all, which covers qk.stashes.
      const id = await saveStash.mutateAsync({ message, includeUntracked });
      onClose();
      return id;
    }}
  />
);
