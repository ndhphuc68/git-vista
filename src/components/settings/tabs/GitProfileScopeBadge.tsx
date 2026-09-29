import React from "react";
import { useTranslation } from "../../../i18n";

export interface GitProfileScopeBadgeProps {
  activeScope: "global" | "repo";
  isOverride: boolean;
}

/** "Inherited from global" / "Override" badge shown next to a repo-scope identity field. */
export const GitProfileScopeBadge: React.FC<GitProfileScopeBadgeProps> = ({
  activeScope,
  isOverride,
}) => {
  const { t } = useTranslation();

  if (activeScope !== "repo") return null;

  if (!isOverride) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
        {t.settings.profile.inheritedFromGlobal}
      </span>
    );
  }

  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
      {t.settings.profile.overrideRepoOption}
    </span>
  );
};
