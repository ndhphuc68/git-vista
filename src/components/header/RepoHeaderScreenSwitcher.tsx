import React from "react";
import clsx from "clsx";
import { PanelLeft } from "lucide-react";
import { type ActiveScreen } from "../../store/useViewStore";
import { type Translations } from "../../i18n/vi";
import { RepoHeaderScreenTabs } from "./RepoHeaderScreenTabs";

interface RepoHeaderScreenSwitcherProps {
  t: Translations;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  shortcutSidebar: string;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  shortcutLabel1: string;
  shortcutLabel2: string;
  shortcutLabel3?: string;
  totalChanges: number;
  isGitHub?: boolean;
  openPrCount?: number;
}

/** Left cluster of the repo header: sidebar toggle and the history/changes/pull-requests screen tabs. */
export const RepoHeaderScreenSwitcher: React.FC<RepoHeaderScreenSwitcherProps> = ({
  t,
  sidebarOpen,
  toggleSidebar,
  shortcutSidebar,
  activeScreen,
  setActiveScreen,
  shortcutLabel1,
  shortcutLabel2,
  shortcutLabel3,
  totalChanges,
  isGitHub,
  openPrCount,
}) => {
  return (
    <div className="flex items-center gap-2.5 min-w-0 shrink">
      <button
        type="button"
        data-testid="toggle-sidebar"
        onClick={toggleSidebar}
        className={clsx(
          "flex items-center justify-center w-8 h-8 border border-border-subtle rounded-md cursor-pointer shrink-0 transition-colors shadow-2xs",
          sidebarOpen
            ? "bg-accent-subtle text-link font-semibold"
            : "bg-transparent text-secondary hover:bg-surface-hover hover:text-primary"
        )}
        title={t.header.toggleSidebar.replace("{shortcut}", shortcutSidebar)}
      >
        <PanelLeft size={16} />
      </button>

      <RepoHeaderScreenTabs
        t={t}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        shortcutLabel1={shortcutLabel1}
        shortcutLabel2={shortcutLabel2}
        shortcutLabel3={shortcutLabel3}
        totalChanges={totalChanges}
        isGitHub={isGitHub}
        openPrCount={openPrCount}
      />
    </div>
  );
};
