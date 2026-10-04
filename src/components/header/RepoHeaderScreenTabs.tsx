import React from "react";
import clsx from "clsx";
import { History, FileDiff, GitPullRequest } from "lucide-react";
import { type ActiveScreen } from "../../store/useViewStore";
import { type Translations } from "../../i18n/vi";

export interface RepoHeaderScreenTabsProps {
  t: Translations;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  shortcutLabel1: string;
  shortcutLabel2: string;
  shortcutLabel3?: string;
  totalChanges: number;
  isGitHub?: boolean;
  openPrCount?: number;
}

interface TabButtonProps {
  active: boolean;
  testId: string;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  testId,
  onClick,
  title,
  icon,
  label,
  badge,
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    data-testid={testId}
    onClick={onClick}
    className={clsx(
      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-all duration-150 btn-press outline-none focus:outline-none",
      active
        ? "bg-surface text-primary shadow-xs border border-border-subtle font-bold"
        : "bg-transparent text-secondary hover:text-primary font-medium"
    )}
    title={title}
  >
    {icon}
    <span>{label}</span>
    {badge}
  </button>
);

const ChangesTabButton: React.FC<{
  active: boolean;
  totalChanges: number;
  onClick: () => void;
  title: string;
  label: string;
}> = ({ active, totalChanges, onClick, title, label }) => (
  <TabButton
    active={active}
    testId="tab-changes"
    onClick={onClick}
    title={title}
    icon={<FileDiff size={15} className={active ? "text-accent" : "text-secondary"} />}
    label={label}
    badge={
      totalChanges > 0 ? (
        <span
          data-testid="changes-badge"
          className="inline-flex items-center justify-center px-1.5 min-w-4 h-4 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 leading-none animate-scale-in"
        >
          {totalChanges}
        </span>
      ) : undefined
    }
  />
);

const PullRequestsTabButton: React.FC<{
  active: boolean;
  openPrCount?: number;
  onClick: () => void;
  title: string;
  label: string;
}> = ({ active, openPrCount, onClick, title, label }) => (
  <TabButton
    active={active}
    testId="tab-pull-requests"
    onClick={onClick}
    title={title}
    icon={<GitPullRequest size={15} className={active ? "text-accent" : "text-secondary"} />}
    label={label}
    badge={
      openPrCount !== undefined && openPrCount > 0 ? (
        <span
          data-testid="pull-requests-badge"
          className="inline-flex items-center justify-center px-1.5 min-w-4 h-4 rounded-full text-[10px] font-bold bg-accent/20 text-accent leading-none animate-scale-in"
        >
          {openPrCount}
        </span>
      ) : undefined
    }
  />
);

/** The segmented History/Changes/Pull Requests screen switcher tabs. */
export const RepoHeaderScreenTabs: React.FC<RepoHeaderScreenTabsProps> = ({
  t,
  activeScreen,
  setActiveScreen,
  shortcutLabel1,
  shortcutLabel2,
  shortcutLabel3,
  totalChanges,
  isGitHub,
  openPrCount,
}) => {
  const prTitle = shortcutLabel3
    ? `${t.screens.pullRequests} (${shortcutLabel3})`
    : t.screens.pullRequests;

  return (
    <div
      role="tablist"
      aria-label="Màn hình làm việc"
      className="flex items-center gap-0.5 bg-window p-0.5 rounded-lg border border-border-subtle shrink-0"
    >
      <TabButton
        active={activeScreen === "history"}
        testId="tab-history"
        onClick={() => setActiveScreen("history")}
        title={`History (${shortcutLabel1})`}
        icon={
          <History
            size={15}
            className={activeScreen === "history" ? "text-accent" : "text-secondary"}
          />
        }
        label={t.screens.history}
      />

      <ChangesTabButton
        active={activeScreen === "changes"}
        totalChanges={totalChanges}
        onClick={() => setActiveScreen("changes")}
        title={`Changes (${shortcutLabel2})`}
        label={t.screens.changes}
      />

      {isGitHub && (
        <PullRequestsTabButton
          active={activeScreen === "pull-requests"}
          openPrCount={openPrCount}
          onClick={() => setActiveScreen("pull-requests")}
          title={prTitle}
          label={t.screens.pullRequests}
        />
      )}
    </div>
  );
};
