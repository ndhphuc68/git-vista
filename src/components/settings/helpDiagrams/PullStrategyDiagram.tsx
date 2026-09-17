import React, { useState } from "react";
import { GitMerge, GitPullRequest } from "lucide-react";

export const PullStrategyDiagram: React.FC = () => {
  const [mode, setMode] = useState<"merge" | "rebase">("rebase");

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle tabs */}
      <div className="flex items-center justify-between bg-surface-active/60 p-0.5 rounded-md text-[10px]">
        <button
          type="button"
          onClick={() => setMode("rebase")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            mode === "rebase"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <GitPullRequest size={11} />
          <span>Rebase (Tuyến tính)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("merge")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            mode === "merge"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <GitMerge size={11} />
          <span>Merge (Rẽ nhánh)</span>
        </button>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative h-20 w-full bg-surface/80 rounded-md border border-border-subtle/50 flex items-center justify-center p-1.5 overflow-hidden">
        {mode === "rebase" ? (
          <svg className="w-full h-full max-w-[280px]" viewBox="0 0 280 70" fill="none">
            {/* Base line */}
            <path d="M 20 35 L 260 35" stroke="currentColor" strokeWidth="2" className="text-border-strong" />
            
            {/* Main commits */}
            <circle cx="40" cy="35" r="7" className="fill-blue-500 stroke-surface" strokeWidth="2" />
            <text x="40" y="55" fontSize="8" textAnchor="middle" className="fill-secondary font-mono">C1</text>

            <circle cx="95" cy="35" r="7" className="fill-blue-500 stroke-surface" strokeWidth="2" />
            <text x="95" y="55" fontSize="8" textAnchor="middle" className="fill-secondary font-mono">C2 (remote)</text>

            {/* Rebased commits with glow/animation */}
            <circle cx="160" cy="35" r="7" className="fill-emerald-500 stroke-surface animate-pulse" strokeWidth="2" />
            <text x="160" y="55" fontSize="8" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 font-mono font-bold">C3'</text>

            <circle cx="225" cy="35" r="7" className="fill-emerald-500 stroke-surface animate-pulse" strokeWidth="2" />
            <text x="225" y="55" fontSize="8" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 font-mono font-bold">C4'</text>

            {/* Arrow and badge */}
            <path d="M 255 35 L 250 31 M 255 35 L 250 39" stroke="currentColor" strokeWidth="2" className="text-border-strong" />
            <text x="192" y="20" fontSize="8" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 font-semibold">1 đường thẳng duy nhất</text>
          </svg>
        ) : (
          <svg className="w-full h-full max-w-[280px]" viewBox="0 0 280 70" fill="none">
            {/* Main line */}
            <path d="M 20 22 L 250 22" stroke="currentColor" strokeWidth="2" className="text-border-strong" />
            {/* Branch line */}
            <path d="M 45 22 C 70 22, 70 50, 95 50 L 165 50 C 190 50, 190 22, 215 22" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="text-amber-500/70" />

            {/* Commits */}
            <circle cx="45" cy="22" r="6" className="fill-blue-500 stroke-surface" strokeWidth="2" />
            <circle cx="110" cy="22" r="6" className="fill-blue-500 stroke-surface" strokeWidth="2" />
            <text x="110" y="14" fontSize="7" textAnchor="middle" className="fill-secondary font-mono">remote</text>

            <circle cx="130" cy="50" r="6" className="fill-amber-500 stroke-surface" strokeWidth="2" />
            <text x="130" y="65" fontSize="7" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 font-mono">local</text>

            {/* Merge commit */}
            <circle cx="215" cy="22" r="7" className="fill-purple-500 stroke-surface animate-bounce" strokeWidth="2" />
            <text x="215" y="14" fontSize="7" textAnchor="middle" className="fill-purple-600 dark:fill-purple-400 font-mono font-bold">Merge Commit</text>
          </svg>
        )}
      </div>

      <div className="text-[10px] text-secondary text-center italic">
        {mode === "rebase"
          ? "✨ Rebase: Giữ lịch sử commit gọn gàng, không tạo commit rác."
          : "🔀 Merge: Giữ nguyên lịch sử rẽ nhánh nhưng sinh thêm Merge commit."}
      </div>
    </div>
  );
};
