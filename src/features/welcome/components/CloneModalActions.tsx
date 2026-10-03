import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

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
      <Button variant="secondary" onClick={onCancel}>
        {t.cloneModal.cancel}
      </Button>
      <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
        {isCloning ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>{t.cloneModal.cloning}</span>
          </>
        ) : (
          <span>{t.cloneModal.clone}</span>
        )}
      </Button>
    </div>
  );
};
