import React from "react";
import { Download } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface CloneModalHeaderProps {
  titleId: string;
}

/**
 * Icon, title and description shown at the top of `CloneModal`. Extracted
 * from the component body, keeping the same markup verbatim.
 */
export const CloneModalHeader: React.FC<CloneModalHeaderProps> = ({ titleId }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3.5 mb-6">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-subtle text-link">
        <Download size={22} />
      </div>
      <div>
        <h2 id={titleId} className="text-lg font-bold text-primary">
          {t.cloneModal.title}
        </h2>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">{t.cloneModal.desc}</p>
      </div>
    </div>
  );
};
