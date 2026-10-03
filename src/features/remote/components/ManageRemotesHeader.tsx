import React from "react";
import { Cloud, X, Plus } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface ManageRemotesHeaderProps {
  onClose: () => void;
  onOpenAdd: () => void;
  titleId: string;
}

/**
 * Header bar for `ManageRemotesModal`: icon, title, subtitle, "add remote"
 * button and close button. Extracted from the component body, keeping the
 * same markup verbatim.
 *
 * Kept custom rather than using Modal.Header: this one carries a subtitle
 * and an "add remote" action, and widening Modal.Header with props for
 * those is the boolean-prop creep the compound component exists to avoid.
 */
export const ManageRemotesHeader: React.FC<ManageRemotesHeaderProps> = ({
  onClose,
  onOpenAdd,
  titleId,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-hover/20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
          <Cloud size={20} />
        </div>
        <div>
          <h2 id={titleId} className="text-base font-semibold text-primary m-0">
            {t.modals.remotes.title}
          </h2>
          <p className="text-xs text-secondary m-0 mt-0.5">{t.modals.remotes.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={onOpenAdd}>
          <Plus size={14} />
          <span>{t.modals.remotes.addRemoteBtn}</span>
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
          aria-label={t.common.close}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
