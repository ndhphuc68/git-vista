import React from "react";
import { Settings, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Modal } from "../../shared/ui";
import { useSettingsModalState } from "./useSettingsModalState";
import { SettingsModalSidebar } from "./SettingsModalSidebar";
import { SettingsModalTabContent } from "./SettingsModalTabContent";

interface SettingsModalProps {
  currentRepoPath: string | null;
}

const TITLE_ID = "settings-modal-title";

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { isSettingsOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore();
  const { navGroups, scopeSelector, effectiveScope, effectiveRepoPath } = useSettingsModalState({
    currentRepoPath,
    isSettingsOpen,
  });

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} size="full" labelledBy={TITLE_ID}>
      {/* Fixed 85vh, not just a max: the tab content below scrolls within a
          flex column that needs a definite height, and Modal's panel only
          caps height. The width is wider than any MODAL_SIZE tier, so it is
          set here too. */}
      <div className="w-[85vw] max-w-[85vw] h-[85vh] flex flex-col min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-header/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Settings size={18} className="text-accent" />
            <h2 id={TITLE_ID} className="m-0 text-sm font-semibold text-primary">
              {t.settings.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            aria-label={t.common.close}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SettingsModalSidebar
            navGroups={navGroups}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8">
            <SettingsModalTabContent
              activeTab={activeTab}
              effectiveScope={effectiveScope}
              effectiveRepoPath={effectiveRepoPath}
              scopeSelector={scopeSelector}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
