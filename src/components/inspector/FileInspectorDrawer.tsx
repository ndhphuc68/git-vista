import React, { useEffect } from "react";
import clsx from "clsx";
import { FileText, History, X, Copy, Check } from "lucide-react";
import { useInspectorStore } from "../../store/useInspectorStore";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { BlameView } from "./BlameView";
import { FileHistoryView } from "./FileHistoryView";

interface FileInspectorDrawerProps {
  repoPath: string;
}

export const FileInspectorDrawer: React.FC<FileInspectorDrawerProps> = ({ repoPath }) => {
  const { t } = useTranslation();
  const { isOpen, filePath, commitId, activeTab, closeInspector, setActiveTab } =
    useInspectorStore();

  const [copiedPath, setCopiedPath] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeInspector();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeInspector]);

  if (!isOpen || !filePath) return null;

  const handleCopyPath = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(filePath);
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      }
    } catch {
      // ignore
    }
    useToastStore.getState().showSuccess(t.inspector.copyPathSuccess);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="inspector-backdrop"
        onClick={closeInspector}
        className="fixed inset-0 modal-backdrop z-40 animate-fade-in"
      />

      {/* Slide-over Drawer */}
      <div
        data-testid="file-inspector-drawer"
        className="fixed top-0 right-0 bottom-0 z-50 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-macos flex flex-col overflow-hidden animate-slide-up w-4/5 max-w-[90vw]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-window border-b border-border-subtle gap-3 select-none shrink-0">
          {/* File Path & Copy */}
          <div className="flex items-center gap-2 min-w-0 max-w-[40%]">
            <span
              className="text-secondary font-mono text-xs font-semibold truncate"
              title={filePath}
            >
              {filePath}
            </span>
            <button
              type="button"
              onClick={handleCopyPath}
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
              onClick={() => setActiveTab("blame")}
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
              onClick={() => setActiveTab("history")}
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
              onClick={closeInspector}
              className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              title={t.inspector.closeTooltip}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "blame" ? (
            <BlameView repoPath={repoPath} filePath={filePath} commitId={commitId} />
          ) : (
            <FileHistoryView repoPath={repoPath} filePath={filePath} />
          )}
        </div>
      </div>
    </>
  );
};
