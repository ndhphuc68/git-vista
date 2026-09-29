import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface CloneModalActionsProps {
  onCancel: () => void;
  isSubmitDisabled: boolean;
  isCloning: boolean;
}

/**
 * Cancel / submit buttons at the bottom of `CloneModal`'s form. Extracted
 * from the component body, keeping the same markup verbatim.
 */
export const CloneModalActions: React.FC<CloneModalActionsProps> = ({
  onCancel,
  isSubmitDisabled,
  isCloning,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-border-subtle">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs sm:text-sm font-medium text-secondary hover:text-primary bg-transparent hover:bg-surface-hover border border-border-subtle rounded-lg transition-colors cursor-pointer"
      >
        {t.cloneModal.cancel}
      </button>
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-accent-contrast bg-accent hover:bg-accent-hover active:scale-[0.99] rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {isCloning ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>{t.cloneModal.cloning}</span>
          </>
        ) : (
          <span>{t.cloneModal.clone}</span>
        )}
      </button>
    </div>
  );
};
