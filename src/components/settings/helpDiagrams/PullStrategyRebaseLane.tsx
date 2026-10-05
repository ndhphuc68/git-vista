import React from "react";

/** The "rebase" lane of the pull-strategy diagram: a single linear commit line. */
export const PullStrategyRebaseLane: React.FC = () => {
  return (
    <svg className="w-full h-full max-w-[340px]" viewBox="0 0 340 85" fill="none">
      {/* Base line */}
      <path
        d="M 20 42 L 315 42"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-border-strong"
      />

      {/* Main commits */}
      <circle cx="45" cy="42" r="9" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
      <text
        x="45"
        y="65"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-secondary font-mono"
      >
        C1
      </text>

      <circle cx="115" cy="42" r="9" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
      <text
        x="115"
        y="65"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-secondary font-mono"
      >
        C2 (remote)
      </text>

      {/* Rebased commits with pulse animation */}
      <circle
        cx="195"
        cy="42"
        r="10"
        className="fill-emerald-500 stroke-surface animate-pulse"
        strokeWidth="2.5"
      />
      <text
        x="195"
        y="66"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-emerald-600 dark:fill-emerald-400 font-mono"
      >
        C3'
      </text>

      <circle
        cx="270"
        cy="42"
        r="10"
        className="fill-emerald-500 stroke-surface animate-pulse"
        strokeWidth="2.5"
      />
      <text
        x="270"
        y="66"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-emerald-600 dark:fill-emerald-400 font-mono"
      >
        C4'
      </text>

      {/* Arrow and badge */}
      <path
        d="M 315 42 L 308 36 M 315 42 L 308 48"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-border-strong"
      />
      <text
        x="232"
        y="22"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-emerald-600 dark:fill-emerald-400"
      >
        1 đường thẳng duy nhất
      </text>
    </svg>
  );
};
