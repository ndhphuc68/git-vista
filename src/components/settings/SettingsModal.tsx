import React from "react";
import { Settings, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Modal } from "../../shared/ui";
import { useSettingsModalState } from "./useSettingsModalState";
import { SettingsModalScopeSwitcher } from "./SettingsModalScopeSwitcher";
import { SettingsModalSidebar } from "./SettingsModalSidebar";
import { SettingsModalTabContent } from "./SettingsModalTabContent";

interface SettingsModalProps {
  currentRepoPath: string | null;
}

const TITLE_ID = "settings-modal-title";

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { isSettingsOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore();

  const {
    setScope,
    selectedRepoPath,
    setSelectedRepoPath,
    openRepoTabs,
    activeRepo,
    navItems,
    getRepoDisplayName,
    effectiveScope,
    effectiveRepoPath,
  } = useSettingsModalState({ currentRepoPath, isSettingsOpen });

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} size="full" labelledBy={TITLE_ID}>
      {/* Fixed 85vh, not just a max: the tab content below scrolls within a
          flex column that needs a definite height, and Modal's panel only
          caps height. The original was also 85vw wide, wider than any
          MODAL_SIZE tier, so the width is set here too. */}
      <div className="w-[85vw] max-w-[85vw] h-[85vh] flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-subtle bg-surface-header/40 shrink-0 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Settings size={20} />
              </div>
              <div>
                <h2 id={TITLE_ID} className="text-base font-semibold text-primary m-0">
                  {t.settings.title}
                </h2>
                <p className="text-xs text-secondary m-0 mt-0.5">{t.settings.description}</p>
              </div>
            </div>

            {currentRepoPath && (
              <SettingsModalScopeSwitcher
                currentRepoPath={currentRepoPath}
                effectiveScope={effectiveScope}
                setScope={setScope}
                openRepoTabs={openRepoTabs}
                selectedRepoPath={selectedRepoPath}
                setSelectedRepoPath={setSelectedRepoPath}
                activeRepo={activeRepo}
                getRepoDisplayName={getRepoDisplayName}
              />
            )}

            <button
              type="button"
              onClick={closeSettings}
              className="flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors shrink-0"
              aria-label={t.common.close}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Left Sidebar Tabs + Right Content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <SettingsModalSidebar
              navItems={navItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Main Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-8">
              <SettingsModalTabContent
                activeTab={activeTab}
                effectiveScope={effectiveScope}
                effectiveRepoPath={effectiveRepoPath}
                setScope={setScope}
              />
            </div>
          </div>
      </div>
    </Modal>
  );
};
