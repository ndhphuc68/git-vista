import React from "react";
import { RefreshCw } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { useTranslation } from "../i18n";
import { type RepoChangedPayload } from "../ipc/client";
import { ControlsBarSwitchers } from "./ControlsBarSwitchers";
import { ControlsBarDevTools } from "./ControlsBarDevTools";
import { useControlsBarIpc } from "./useControlsBarIpc";

interface ControlsBarProps {
  lastEvent: RepoChangedPayload | null;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ lastEvent }) => {
  const { t, actions } = useTranslation();
  const { theme, colorblind, locale, mode, setTheme, setColorblind, setLocale, setMode } =
    useSettingsStore();

  const { devToolsOpen, toggleDevTools } = useLayoutStore();

  const { pingResult, sysInfo, loading, handleTestIpc, handleSimulateRepoChange } =
    useControlsBarIpc();

  return (
    <div
      data-testid="controls-bar"
      className="flex flex-col bg-surface border-b border-border-subtle transition-colors duration-200 ease-macos shrink-0"
    >
      {/* Top Compact Controls Row */}
      <div className="flex items-center justify-between px-3 py-1 min-h-[36px] gap-2 overflow-x-auto whitespace-nowrap">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="px-2.5 py-1 rounded-sm bg-accent text-accent-contrast text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-accent-hover active:scale-[0.98] transition-all">
            <RefreshCw size={11} />
            <span>{actions.fetch}</span>
          </button>
          <button className="px-2.5 py-1 rounded-sm bg-surface text-primary border border-border-subtle text-xs font-medium cursor-pointer hover:bg-surface-hover active:scale-[0.98] transition-all">
            ↓ {actions.pull}
          </button>
          <button className="px-2.5 py-1 rounded-sm bg-surface text-primary border border-border-subtle text-xs font-medium cursor-pointer hover:bg-surface-hover active:scale-[0.98] transition-all">
            ↑ {actions.push}
          </button>
        </div>

        {/* Right: Switchers & DevTools Toggle */}
        <ControlsBarSwitchers
          t={t}
          theme={theme}
          setTheme={setTheme}
          colorblind={colorblind}
          setColorblind={setColorblind}
          locale={locale}
          setLocale={setLocale}
          mode={mode}
          setMode={setMode}
          devToolsOpen={devToolsOpen}
          toggleDevTools={toggleDevTools}
        />
      </div>

      {/* IPC Test & Status Area (Collapsible Drawer) */}
      {devToolsOpen && (
        <ControlsBarDevTools
          t={t}
          loading={loading}
          pingResult={pingResult}
          sysInfo={sysInfo}
          lastEvent={lastEvent}
          onTestIpc={handleTestIpc}
          onSimulateRepoChange={handleSimulateRepoChange}
        />
      )}
    </div>
  );
};
