import React from "react";
import clsx from "clsx";
import { FileText, History, X, Copy, Check } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { InspectorTab } from "../../store/useInspectorStore";

interface FileInspectorHeaderProps {
  filePath: string;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onClose: () => void;
  copiedPath: boolean;
  onCopyPath: () => void;
}

/** Top bar of FileInspectorDrawer: file path + copy, blame/history tabs, and close button. */
export const FileInspectorHeader: React.FC<FileInspectorHeaderProps> = ({
  filePath,
  activeTab,
  onTabChange,
  onClose,
  copiedPath,
  onCopyPath,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-window border-b border-border-subtle gap-3 select-none shrink-0">
      {/* File Path & Copy */}
      <div className="flex items-center gap-2 min-w-0 max-w-[40%]">
        <span className="text-secondary font-mono text-xs font-semibold truncate" title={filePath}>
          {filePath}
        </span>
        <button
          type="button"
          onClick={onCopyPath}
          className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
          title={t.inspector.copyPath}
        >
          {copiedPath ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border-subtle shrink-0">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "blame"}
          onClick={() => onTabChange("blame")}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
            activeTab === "blame"
              ? "bg-accent text-accent-contrast shadow-2xs"
              : "text-secondary hover:text-primary"
          )}
        >
          <FileText size={13} />
          <span>{t.inspector.blameTab}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          onClick={() => onTabChange("history")}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
            activeTab === "history"
              ? "bg-accent text-accent-contrast shadow-2xs"
              : "text-secondary hover:text-primary"
          )}
        >
          <History size={13} />
          <span>{t.inspector.historyTab}</span>
        </button>
      </div>

      {/* Close button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-testid="inspector-close-btn"
          onClick={onClose}
          className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          title={t.inspector.closeTooltip}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
