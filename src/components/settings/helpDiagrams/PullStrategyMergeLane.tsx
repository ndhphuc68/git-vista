import React from "react";

/** The "merge" lane of the pull-strategy diagram: a diverging branch reconnected by a merge commit. */
export const PullStrategyMergeLane: React.FC = () => {
  return (
    <svg className="w-full h-full max-w-[340px]" viewBox="0 0 340 85" fill="none">
      {/* Main line */}
      <path
        d="M 20 28 L 310 28"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-border-strong"
      />
      {/* Branch line */}
      <path
        d="M 50 28 C 80 28, 80 62, 110 62 L 195 62 C 225 62, 225 28, 255 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="4 4"
        className="text-amber-500/80"
      />

      {/* Commits */}
      <circle cx="50" cy="28" r="8" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
      <circle cx="130" cy="28" r="8" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
      <text
        x="130"
        y="17"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-secondary font-mono"
      >
        remote
      </text>

      <circle cx="150" cy="62" r="8" className="fill-amber-500 stroke-surface" strokeWidth="2.5" />
      <text
        x="150"
        y="80"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-amber-600 dark:fill-amber-400 font-mono"
      >
        local
      </text>

      {/* Merge commit */}
      <circle
        cx="255"
        cy="28"
        r="10"
        className="fill-purple-500 stroke-surface animate-bounce"
        strokeWidth="2.5"
      />
      <text
        x="255"
        y="16"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-purple-600 dark:fill-purple-400 font-mono"
      >
        Merge Commit
      </text>
    </svg>
  );
};
