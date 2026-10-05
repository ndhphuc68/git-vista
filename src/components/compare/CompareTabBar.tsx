import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";

interface CompareTabBarProps {
  activeTab: "commits" | "files";
  filesCount: number;
  commitsCount: number;
  onSelectTab: (tab: "commits" | "files") => void;
}

/** Files/Commits tab switcher for the left column of CompareModal. */
export const CompareTabBar: React.FC<CompareTabBarProps> = ({
  activeTab,
  filesCount,
  commitsCount,
  onSelectTab,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex border-b border-border-subtle bg-surface shrink-0 select-none">
      <button
        type="button"
        onClick={() => onSelectTab("files")}
        className={clsx(
          "flex-1 py-2.5 px-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer",
          activeTab === "files"
            ? "border-accent text-link bg-accent/5"
            : "border-transparent text-secondary hover:text-primary hover:bg-surface-hover"
        )}
      >
        {t.compare.tabFiles.replace("{count}", String(filesCount))}
      </button>
      <button
        type="button"
        onClick={() => onSelectTab("commits")}
        className={clsx(
          "flex-1 py-2.5 px-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer",
          activeTab === "commits"
            ? "border-accent text-link bg-accent/5"
            : "border-transparent text-secondary hover:text-primary hover:bg-surface-hover"
        )}
      >
        {t.compare.tabCommits.replace("{count}", String(commitsCount))}
      </button>
    </div>
  );
};
