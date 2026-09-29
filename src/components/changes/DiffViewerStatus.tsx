import React from "react";
import { FileCode, AlertTriangle } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface DiffViewerStatusProps {
  variant: "loading" | "error" | "binary";
}

/** The loading, error and binary-file placeholder states of the diff viewer. */
export const DiffViewerStatus: React.FC<DiffViewerStatusProps> = ({ variant }) => {
  const { t } = useTranslation();

  if (variant === "loading") {
    return (
      <div className="flex items-center justify-center h-full text-secondary text-xs">
        {t.diff.readingDiff}
      </div>
    );
  }

  if (variant === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-tertiary text-xs">
        <AlertTriangle size={18} className="text-diff-remove-text" />
        <span>{t.diff.diffError}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-secondary text-xs">
      <FileCode size={24} className="text-tertiary" />
      <span>{t.diff.binaryFile}</span>
    </div>
  );
};
