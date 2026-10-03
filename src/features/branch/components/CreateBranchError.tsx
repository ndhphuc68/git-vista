import React from "react";
import { Archive } from "lucide-react";
import { Alert, Button } from "../../../shared/ui";
import type { Translations } from "../../../i18n/vi";
import type { ConflictActions } from "../hooks/useCreateBranchConflict";

export interface CreateBranchErrorProps {
  t: Translations;
  error: string;
  /** Set when the failure was a checkout conflict; adds the ways past it. */
  actions: ConflictActions | null;
}

/** The error shown in CreateBranchModal, with stash/create-only buttons for a checkout conflict. */
export const CreateBranchError: React.FC<CreateBranchErrorProps> = ({ t, error, actions }) => {
  if (!actions) return <Alert variant="error">{error}</Alert>;

  const { pendingAction, onStashAndCreate, onCreateOnly } = actions;
  const busy = pendingAction !== null;
  return (
    <div className="flex flex-col gap-2.5">
      <Alert variant="error">{error}</Alert>
      <div className="flex justify-end gap-2.5">
        <Button
          variant="secondary"
          onClick={onCreateOnly}
          loading={pendingAction === "createOnly"}
          disabled={busy}
        >
          {t.modals.createBranch.conflictCreateOnly}
        </Button>
        <Button onClick={onStashAndCreate} loading={pendingAction === "stash"} disabled={busy}>
          {pendingAction !== "stash" && <Archive size={13} />}
          {t.modals.createBranch.conflictStashAndCreate}
        </Button>
      </div>
    </div>
  );
};
