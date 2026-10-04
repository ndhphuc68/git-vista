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
          "group relative flex items-center gap-2 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 select-none min-w-[120px] max-w-[180px] outline-none focus:outline-none focus-visible:outline-none ring-0",
          isActive
            ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface border-t border-x border-border-subtle"
            : "text-secondary hover:text-primary hover:bg-surface-hover/50 font-normal border-t border-x border-transparent"
        )}
        title="Home (Welcome)"
      >
        <Home
          size={14}
          className={clsx(
            "shrink-0 transition-colors",
            isActive ? "text-accent" : "text-secondary group-hover:text-primary"
          )}
        />
        <span className="truncate">Home</span>
      </div>
      {showSeparator && <div className="h-4 w-px bg-border-subtle/80 my-auto shrink-0 mx-0.5" />}
    </>
  );
};
