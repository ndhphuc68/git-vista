import React from "react";
import {
  GitBehaviorPullFetchSection,
  type GitBehaviorPullFetchSectionProps,
} from "./GitBehaviorPullFetchSection";
import { GitBehaviorRebaseSection } from "./GitBehaviorRebaseSection";
import { GitBehaviorConfirmationsSection } from "./GitBehaviorConfirmationsSection";

export interface GitBehaviorOptionsProps extends GitBehaviorPullFetchSectionProps {
  rebaseAutostash: boolean;
  onToggleRebaseAutostash: () => void;
}

/** Pull & fetch, rebase, and safety confirmation sections of the git behavior tab. */
export const GitBehaviorOptions: React.FC<GitBehaviorOptionsProps> = ({
  rebaseAutostash,
  onToggleRebaseAutostash,
  ...pullFetch
}) => (
  <>
    <GitBehaviorPullFetchSection {...pullFetch} />
    <GitBehaviorRebaseSection
      rebaseAutostash={rebaseAutostash}
      onToggleRebaseAutostash={onToggleRebaseAutostash}
    />
    <GitBehaviorConfirmationsSection />
  </>
);
