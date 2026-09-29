import React from "react";
import clsx from "clsx";
import { History, FileDiff } from "lucide-react";
import { type ActiveScreen } from "../../store/useViewStore";
import { type Translations } from "../../i18n/vi";

interface RepoHeaderScreenTabsProps {
  t: Translations;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  shortcutLabel1: string;
  shortcutLabel2: string;
  totalChanges: number;
}

/** The segmented History/Changes screen switcher tabs. */
export const RepoHeaderScreenTabs: React.FC<RepoHeaderScreenTabsProps> = ({
  t,
  activeScreen,
  setActiveScreen,
  shortcutLabel1,
  shortcutLabel2,
  totalChanges,
}) => {
  const isHistoryActive = activeScreen === "history";
  const isChangesActive = activeScreen === "changes";

  return (
    <div
      role="tablist"
      aria-label="Màn hình làm việc"
      className="flex items-center gap-0.5 bg-window p-0.5 rounded-lg border border-border-subtle shrink-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isHistoryActive}
        data-testid="tab-history"
        onClick={() => setActiveScreen("history")}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 btn-press outline-none focus:outline-none",
          isHistoryActive
            ? "bg-surface text-primary shadow-xs border border-border-subtle font-bold"
            : "bg-transparent text-secondary hover:text-primary font-medium"
        )}
        title={`History (${shortcutLabel1})`}
      >
        <History size={13} className={isHistoryActive ? "text-accent" : "text-secondary"} />
        <span>{t.screens.history}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={isChangesActive}
        data-testid="tab-changes"
        onClick={() => setActiveScreen("changes")}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 btn-press outline-none focus:outline-none",
          isChangesActive
            ? "bg-surface text-primary shadow-xs border border-border-subtle font-bold"
            : "bg-transparent text-secondary hover:text-primary font-medium"
        )}
        title={`Changes (${shortcutLabel2})`}
      >
        <FileDiff size={13} className={isChangesActive ? "text-accent" : "text-secondary"} />
        <span>{t.screens.changes}</span>
        {totalChanges > 0 && (
          <span
            data-testid="changes-badge"
            className="inline-flex items-center justify-center px-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 leading-none animate-scale-in"
          >
            {totalChanges}
          </span>
        )}
      </button>
    </div>
  );
};
