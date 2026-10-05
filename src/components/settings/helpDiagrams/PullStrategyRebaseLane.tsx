import React from "react";

interface LaneCommitProps {
  cx: number;
  label: string;
  /** Rebased commits are larger, green and pulse. */
  rebased?: boolean;
}

const LaneCommit: React.FC<LaneCommitProps> = ({ cx, label, rebased = false }) => (
  <>
    <circle
      cx={cx}
      cy="42"
      r={rebased ? 10 : 9}
      className={
        rebased ? "fill-emerald-500 stroke-surface animate-pulse" : "fill-blue-500 stroke-surface"
      }
      strokeWidth="2.5"
    />
    <text
      x={cx}
      y={rebased ? 66 : 65}
      fontSize={rebased ? 11 : 10}
      fontWeight="bold"
      textAnchor="middle"
      className={
        rebased ? "fill-emerald-600 dark:fill-emerald-400 font-mono" : "fill-secondary font-mono"
      }
    >
      {label}
    </text>
  </>
);

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
      <LaneCommit cx={45} label="C1" />
      <LaneCommit cx={115} label="C2 (remote)" />

      {/* Rebased commits with pulse animation */}
      <LaneCommit cx={195} label="C3'" rebased />
      <LaneCommit cx={270} label="C4'" rebased />

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
