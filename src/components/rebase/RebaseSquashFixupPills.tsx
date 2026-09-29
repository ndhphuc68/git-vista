import React from "react";
import clsx from "clsx";
import type { RebaseActionKind } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { getRebaseActionColor } from "./rebaseActionColor";

export interface RebaseSquashFixupPillsProps {
  currentAction: RebaseActionKind;
  isFirst: boolean;
  onActionChange: (action: RebaseActionKind) => void;
}

/** The Squash and Fixup pills, which share the same first-row disabled tooltip. */
export const RebaseSquashFixupPills: React.FC<RebaseSquashFixupPillsProps> = ({
  currentAction,
  isFirst,
  onActionChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onActionChange("Squash")}
        title={
          isFirst
            ? t.modals.interactiveRebase.validation.firstCannotSquash
            : t.modals.interactiveRebase.actions.squashDesc
        }
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
          getRebaseActionColor("Squash", currentAction === "Squash")
        )}
      >
        {t.modals.interactiveRebase.actions.squash}
      </button>

      <button
        type="button"
        disabled={isFirst}
        onClick={() => onActionChange("Fixup")}
        title={
          isFirst
            ? t.modals.interactiveRebase.validation.firstCannotSquash
            : t.modals.interactiveRebase.actions.fixupDesc
        }
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
          getRebaseActionColor("Fixup", currentAction === "Fixup")
        )}
      >
        {t.modals.interactiveRebase.actions.fixup}
      </button>
    </>
  );
};
