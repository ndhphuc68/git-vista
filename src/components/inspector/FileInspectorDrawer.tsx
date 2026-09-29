import React, { useEffect } from "react";
import { useInspectorStore } from "../../store/useInspectorStore";
import { useTranslation } from "../../i18n";
import { useToastStore } from "../../store/useToastStore";
import { BlameView } from "./BlameView";
import { FileHistoryView } from "./FileHistoryView";
import { FileInspectorHeader } from "./FileInspectorHeader";

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
        <FileInspectorHeader
          filePath={filePath}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={closeInspector}
          copiedPath={copiedPath}
          onCopyPath={handleCopyPath}
        />

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
