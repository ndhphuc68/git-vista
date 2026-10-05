import React from "react";
import clsx from "clsx";
import type { RebasePlanStep, RebaseActionKind } from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";
import { useTranslation } from "../../i18n";
import { getRebaseActionColor } from "./rebaseActionColor";
import { RebaseSquashFixupPills } from "./RebaseSquashFixupPills";

export interface RebaseActionPillsProps {
  step: RebasePlanStep;
  isFirst: boolean;
  onActionChange: (action: RebaseActionKind) => void;
}

export const RebaseActionPills: React.FC<RebaseActionPillsProps> = ({
  step,
  isFirst,
  onActionChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-surface-subtle border border-border-subtle shrink-0">
      {/* Pick */}
      <button
        type="button"
        onClick={() => onActionChange(REBASE_ACTION.PICK)}
        title={t.modals.interactiveRebase.actions.pickDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor(REBASE_ACTION.PICK, step.action === REBASE_ACTION.PICK)
        )}
      >
        {t.modals.interactiveRebase.actions.pick}
      </button>

      {/* Reword */}
      <button
        type="button"
        onClick={() => onActionChange(REBASE_ACTION.REWORD)}
        title={t.modals.interactiveRebase.actions.rewordDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor(REBASE_ACTION.REWORD, step.action === REBASE_ACTION.REWORD)
        )}
      >
        {t.modals.interactiveRebase.actions.reword}
      </button>

      <RebaseSquashFixupPills
        currentAction={step.action}
        isFirst={isFirst}
        onActionChange={onActionChange}
      />

      {/* Drop */}
      <button
        type="button"
        onClick={() => onActionChange(REBASE_ACTION.DROP)}
        title={t.modals.interactiveRebase.actions.dropDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor(REBASE_ACTION.DROP, step.action === REBASE_ACTION.DROP)
        )}
      >
        {t.modals.interactiveRebase.actions.drop}
      </button>
    </div>
  );
};
