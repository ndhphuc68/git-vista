import React from "react";
import { type GitHubLabel } from "../../ipc/githubApi";

interface PullRequestLabelsProps {
  labels: GitHubLabel[];
}

/** Label pills for a pull request; renders nothing when there are none. */
export const PullRequestLabels: React.FC<PullRequestLabelsProps> = ({ labels }) => {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((l) => (
        <span
          key={l.name}
          style={{
            backgroundColor: `#${l.color}20`,
            borderColor: `#${l.color}50`,
            color: `#${l.color}`,
          }}
          className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
        >
          {l.name}
        </span>
      ))}
    </div>
  );
};
