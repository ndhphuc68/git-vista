import React, { useEffect, useState } from "react";
import { Settings, X, User, Palette, Sliders, Globe, FolderGit2 } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore, SettingsTab } from "../../store/useSettingsStore";
import { useTabStore } from "../../store/useTabStore";
import { Transition } from "../common/Transition";
import { GitProfileTab } from "./tabs/GitProfileTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { GitBehaviorTab } from "./tabs/GitBehaviorTab";

interface SettingsModalProps {
  currentRepoPath: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRepoPath }) => {
  const { t } = useTranslation();
  const { isSettingsOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore();
  const { tabs, activeTabId } = useTabStore();

  const openRepoTabs = tabs.filter((t) => t.type === "repo" && t.repo);
  const activeRepo = currentRepoPath
    ? openRepoTabs.find((t) => t.id === currentRepoPath)
    : openRepoTabs.find((t) => t.id === activeTabId) || openRepoTabs[0];

  const [scope, setScope] = useState<"global" | "repo">(() => {
    return currentRepoPath || (activeTabId !== "home" && openRepoTabs.length > 0)
      ? "repo"
      : "global";
  });

  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(
    activeRepo?.id || currentRepoPath || (openRepoTabs[0]?.id ?? "")
  );

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  useEffect(() => {
    if (currentRepoPath) {
      setSelectedRepoPath(currentRepoPath);
      setScope("repo");
    } else if (openRepoTabs.length > 0) {
      if (!selectedRepoPath || !openRepoTabs.some((t) => t.id === selectedRepoPath)) {
        setSelectedRepoPath(openRepoTabs[0].id);
      }
    } else {
      setScope("global");
    }
  }, [currentRepoPath, openRepoTabs.length, isSettingsOpen]);

  const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: t.settings.tabs.profile, icon: <User size={16} /> },
    { id: "appearance", label: t.settings.tabs.appearance, icon: <Palette size={16} /> },
    { id: "behavior", label: t.settings.tabs.behavior, icon: <Sliders size={16} /> },
  ];

  const effectiveRepoPath = scope === "repo" ? (selectedRepoPath || currentRepoPath) : null;

  return (
    <Transition
      show={isSettingsOpen}
      className="fixed inset-0 z-[9999]"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        onClick={closeSettings}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div
          className="bg-surface border border-border-subtle rounded-2xl shadow-2xl w-[85vw] h-[85vh] overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-subtle bg-surface-header/40 shrink-0 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Settings size={20} />
              </div>
              <div>
                <h2
                  id="settings-modal-title"
                  className="text-base font-semibold text-primary m-0"
                >
                  {t.settings.title}
                </h2>
                <p className="text-xs text-secondary m-0 mt-0.5">
                  {t.settings.description}
                </p>
              </div>
            </div>

            {/* 2-Tier Scope Switcher */}
            <div
              data-testid="scope-switcher"
              className="flex items-center bg-surface-header/80 p-1 rounded-xl border border-border-subtle text-xs shrink-0"
            >
              <button
                type="button"
                data-testid="scope-btn-global"
                data-active={scope === "global"}
                onClick={() => setScope("global")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  scope === "global"
                    ? "bg-accent text-white font-semibold shadow-xs"
                    : "text-secondary hover:text-primary hover:bg-surface-hover"
                }`}
              >
                <Globe size={14} />
                <span>{t.settings.scopeSwitcher.global}</span>
              </button>

              <button
                type="button"
                data-testid="scope-btn-repo"
                data-active={scope === "repo"}
                disabled={openRepoTabs.length === 0 && !currentRepoPath}
                onClick={() => {
                  if (openRepoTabs.length > 0 || currentRepoPath) {
                    setScope("repo");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  openRepoTabs.length === 0 && !currentRepoPath
                    ? "text-muted opacity-40 cursor-not-allowed"
                    : scope === "repo"
                    ? "bg-accent text-white font-semibold shadow-xs cursor-pointer"
                    : "text-secondary hover:text-primary hover:bg-surface-hover cursor-pointer"
                }`}
              >
                <FolderGit2 size={14} />
                <span>{t.settings.scopeSwitcher.repo}</span>

                {openRepoTabs.length > 1 && (
                  <select
                    data-testid="scope-repo-select"
                    value={selectedRepoPath}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setSelectedRepoPath(e.target.value);
                      setScope("repo");
                    }}
                    className="ml-1 bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-xs text-primary font-mono cursor-pointer outline-hidden"
                  >
                    {openRepoTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.alias || tab.repo?.name || tab.id}
                      </option>
                    ))}
                  </select>
                )}

                {openRepoTabs.length === 1 && (
                  <span className="ml-1 font-mono text-[11px] opacity-85">
                    ({openRepoTabs[0].alias || openRepoTabs[0].repo?.name})
                  </span>
                )}
              </button>
            </div>

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
            {/* Sidebar Tabs */}
            <div className="w-60 shrink-0 border-r border-border-subtle bg-surface-header/20 p-4 flex flex-col justify-between">
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-accent text-white font-semibold shadow-xs"
                          : "text-secondary hover:bg-surface-hover hover:text-primary"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-0.5 px-2 py-1 text-[11px] text-tertiary">
                <span className="font-semibold text-secondary">GitVista</span>
                <span>v0.1.0 • macOS Edition</span>
              </div>
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-8">
              <div key={`${activeTab}-${scope}-${selectedRepoPath}`} className="animate-fade-in max-w-3xl">
                {activeTab === "profile" && (
                  <GitProfileTab
                    scope={scope}
                    currentRepoPath={effectiveRepoPath}
                    onScopeChange={setScope}
                  />
                )}
                {activeTab === "appearance" && <AppearanceTab />}
                {activeTab === "behavior" && (
                  <GitBehaviorTab
                    scope={scope}
                    currentRepoPath={effectiveRepoPath}
                    onScopeChange={setScope}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
