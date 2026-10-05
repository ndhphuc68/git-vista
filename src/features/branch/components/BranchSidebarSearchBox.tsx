/**
 * The sidebar's search box: filters branches/tags as you type, with a clear
 * button and an Escape shortcut.
 */
import React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface BranchSidebarSearchBoxProps {
  search: string;
  setSearch: (value: string) => void;
}

export const BranchSidebarSearchBox: React.FC<BranchSidebarSearchBoxProps> = ({
  search,
  setSearch,
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-3 py-2 border-b border-border-subtle bg-surface shrink-0">
      <div className="group relative flex items-center gap-2 bg-window/80 hover:bg-window focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/20 border border-border-subtle focus-within:border-accent rounded-md px-2.5 py-1.5 transition-all duration-150 shadow-2xs">
        <Search
          size={13}
          className="text-tertiary group-focus-within:text-link shrink-0 transition-colors"
        />
        <input
          type="text"
          placeholder={t.sidebar.searchPlaceholder}
          aria-label={t.sidebar.searchAria}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearch("");
              e.currentTarget.blur();
            }
          }}
          className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-xs text-primary placeholder:text-tertiary w-full leading-normal selection:bg-accent/20"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label={t.sidebar.clearSearchAria}
            title={t.sidebar.clearSearchTitle}
            className="p-0.5 -mr-1 text-tertiary hover:text-primary hover:bg-surface-hover rounded-full cursor-pointer transition-colors flex items-center justify-center border-0 bg-transparent"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd className="hidden group-hover:inline-block group-focus-within:hidden text-[10px] font-mono text-tertiary/70 bg-surface border border-border-subtle/80 rounded px-1.5 py-0.2 select-none pointer-events-none transition-opacity">
            /
          </kbd>
        )}
      </div>
    </div>
  );
};
