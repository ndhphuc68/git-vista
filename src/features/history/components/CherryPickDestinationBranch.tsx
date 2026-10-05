import { GitBranch } from "lucide-react";
import { useTranslation } from "../../../i18n";

interface CherryPickDestinationBranchProps {
  currentBranch: string;
}

/** Shows the branch a cherry-pick will land on. */
export function CherryPickDestinationBranch({ currentBranch }: CherryPickDestinationBranchProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-xs bg-window px-3 py-2 rounded-md border border-border-subtle">
      <span className="text-secondary text-[11px]">{t.modals.cherryPick.destinationBranch}</span>
      <span className="flex items-center gap-1 font-semibold text-primary">
        <GitBranch size={13} className="text-link" />
        {currentBranch}
      </span>
    </div>
  );
}
