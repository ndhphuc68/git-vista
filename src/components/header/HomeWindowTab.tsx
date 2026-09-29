import React from "react";
import { Home } from "lucide-react";
import { clsx } from "clsx";

interface HomeWindowTabProps {
  isActive: boolean;
  showSeparator: boolean;
  onSelect: () => void;
}

/** The fixed Home tab in the WindowTabBar. */
export const HomeWindowTab: React.FC<HomeWindowTabProps> = ({
  isActive,
  showSeparator,
  onSelect,
}) => {
  return (
    <>
      <div
        data-testid="tab-home"
        onClick={onSelect}
        className={clsx(
          "group relative flex items-center gap-2 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 select-none min-w-[140px] max-w-[200px] outline-none focus:outline-none focus-visible:outline-none ring-0",
          isActive
            ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
            : "text-secondary hover:text-primary hover:bg-surface/50 dark:hover:bg-white/[0.04] font-normal"
        )}
        title="Home (Welcome)"
      >
        <Home
          size={14}
          className={clsx(
            "shrink-0",
            isActive ? "text-accent" : "text-secondary group-hover:text-primary"
          )}
        />
        <span className="truncate">Home</span>
      </div>
      {showSeparator && (
        <div className="h-4 w-[1px] bg-border-subtle/80 dark:bg-slate-700/60 my-auto shrink-0 mx-0.5" />
      )}
    </>
  );
};
