import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";
import { type ChangesViewMode } from "../../store/useLayoutStore";
import { type RepoStatusResult } from "../../ipc/bindings.generated";

export interface MobileChangesSwitcherProps {
  activeChangesView: ChangesViewMode;
  setActiveChangesView: (view: ChangesViewMode) => void;
  status: RepoStatusResult | undefined;
}

/** The mobile-only Files/Diff tab switcher shown above the changes screen. */
export const MobileChangesSwitcher: React.FC<MobileChangesSwitcherProps> = ({
  activeChangesView,
  setActiveChangesView,
  status,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="mobile-changes-switcher"
      className="flex items-center p-1 bg-window border-b border-border-subtle gap-1 shrink-0"
    >
      <button
        type="button"
        data-testid="mobile-tab-files"
        onClick={() => setActiveChangesView("files")}
        className={clsx(
          "flex-1 py-1 px-2 rounded-sm text-xs cursor-pointer text-center",
          activeChangesView === "files"
            ? "bg-surface text-primary shadow-sm font-semibold"
            : "bg-transparent text-secondary font-normal"
        )}
      >
        {t.changes.mobileTabFiles.replace(
          "{count}",
          String(
            status
              ? status.staged.length +
                  status.unstaged.length +
                  status.untracked.length +
                  (status.conflicted?.length || 0)
              : 0
          )
        )}
      </button>
      <button
        type="button"
        data-testid="mobile-tab-diff"
        onClick={() => setActiveChangesView("diff")}
        className={clsx(
          "flex-1 py-1 px-2 rounded-sm text-xs cursor-pointer text-center",
          activeChangesView === "diff"
            ? "bg-surface text-primary shadow-sm font-semibold"
            : "bg-transparent text-secondary font-normal"
        )}
      >
        {t.changes.mobileTabDiff}
      </button>
    </div>
  );
};
