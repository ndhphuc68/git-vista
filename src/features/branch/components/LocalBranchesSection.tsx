/**
 * The collapsible BRANCHES section header and body: title, count, the
 * create-branch button, and the tree passed in as children.
 */
import React from "react";
import { ChevronDown, ChevronRight, GitBranch, Plus } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface LocalBranchesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  onCreateBranch: () => void;
  children: React.ReactNode;
}

export const LocalBranchesSection: React.FC<LocalBranchesSectionProps> = ({
  isOpen,
  onToggle,
  count,
  onCreateBranch,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={t.sidebar.branches}
          className="flex items-center gap-1.5 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <GitBranch size={13} />
          <span>
            {t.sidebar.branches} ({count})
          </span>
        </button>
        <button
          type="button"
          onClick={onCreateBranch}
          aria-label={t.sidebar.createBranchTitle}
          title={t.sidebar.createBranchTitle}
          className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-accent hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {isOpen && <div className="flex flex-col gap-0.5 mt-1">{children}</div>}
    </div>
  );
};
