import React from "react";
import clsx from "clsx";
import type { RebasePlanStep, RebaseActionKind } from "../../ipc/bindings.generated";
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
        onClick={() => onActionChange("Pick")}
        title={t.modals.interactiveRebase.actions.pickDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor("Pick", step.action === "Pick")
        )}
      >
        {t.modals.interactiveRebase.actions.pick}
      </button>

      {/* Reword */}
      <button
        type="button"
        onClick={() => onActionChange("Reword")}
        title={t.modals.interactiveRebase.actions.rewordDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor("Reword", step.action === "Reword")
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
        onClick={() => onActionChange("Drop")}
        title={t.modals.interactiveRebase.actions.dropDesc}
        className={clsx(
          "px-2 py-0.5 text-[11px] rounded transition-all border cursor-pointer",
          getRebaseActionColor("Drop", step.action === "Drop")
        )}
      >
        {t.modals.interactiveRebase.actions.drop}
      </button>
    </div>
  );
};
