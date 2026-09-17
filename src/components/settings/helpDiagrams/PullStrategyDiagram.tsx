import React, { useState } from "react";
import { GitMerge, GitPullRequest } from "lucide-react";

export const PullStrategyDiagram: React.FC = () => {
  const [mode, setMode] = useState<"merge" | "rebase">("rebase");

  return (
    <div className="flex flex-col gap-2.5">
      {/* Toggle tabs */}
      <div className="flex items-center justify-between bg-surface-active/70 p-1 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setMode("rebase")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mode === "rebase"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <GitPullRequest size={14} />
          <span>Rebase (Tuyến tính)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("merge")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mode === "merge"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <GitMerge size={14} />
          <span>Merge (Rẽ nhánh)</span>
        </button>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 flex items-center justify-center p-2 overflow-hidden">
        {mode === "rebase" ? (
          <svg className="w-full h-full max-w-[340px]" viewBox="0 0 340 85" fill="none">
            {/* Base line */}
            <path d="M 20 42 L 315 42" stroke="currentColor" strokeWidth="2.5" className="text-border-strong" />
            
            {/* Main commits */}
            <circle cx="45" cy="42" r="9" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
            <text x="45" y="65" fontSize="10" fontWeight="bold" textAnchor="middle" className="fill-secondary font-mono">C1</text>

            <circle cx="115" cy="42" r="9" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
            <text x="115" y="65" fontSize="10" fontWeight="bold" textAnchor="middle" className="fill-secondary font-mono">C2 (remote)</text>

            {/* Rebased commits with pulse animation */}
            <circle cx="195" cy="42" r="10" className="fill-emerald-500 stroke-surface animate-pulse" strokeWidth="2.5" />
            <text x="195" y="66" fontSize="11" fontWeight="bold" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 font-mono">C3'</text>

            <circle cx="270" cy="42" r="10" className="fill-emerald-500 stroke-surface animate-pulse" strokeWidth="2.5" />
            <text x="270" y="66" fontSize="11" fontWeight="bold" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 font-mono">C4'</text>

            {/* Arrow and badge */}
            <path d="M 315 42 L 308 36 M 315 42 L 308 48" stroke="currentColor" strokeWidth="2.5" className="text-border-strong" />
            <text x="232" y="22" fontSize="11" fontWeight="bold" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400">
              1 đường thẳng duy nhất
            </text>
          </svg>
        ) : (
          <svg className="w-full h-full max-w-[340px]" viewBox="0 0 340 85" fill="none">
            {/* Main line */}
            <path d="M 20 28 L 310 28" stroke="currentColor" strokeWidth="2.5" className="text-border-strong" />
            {/* Branch line */}
            <path d="M 50 28 C 80 28, 80 62, 110 62 L 195 62 C 225 62, 225 28, 255 28" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" className="text-amber-500/80" />

            {/* Commits */}
            <circle cx="50" cy="28" r="8" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
            <circle cx="130" cy="28" r="8" className="fill-blue-500 stroke-surface" strokeWidth="2.5" />
            <text x="130" y="17" fontSize="10" fontWeight="bold" textAnchor="middle" className="fill-secondary font-mono">remote</text>

            <circle cx="150" cy="62" r="8" className="fill-amber-500 stroke-surface" strokeWidth="2.5" />
            <text x="150" y="80" fontSize="10" fontWeight="bold" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 font-mono">local</text>

            {/* Merge commit */}
            <circle cx="255" cy="28" r="10" className="fill-purple-500 stroke-surface animate-bounce" strokeWidth="2.5" />
            <text x="255" y="16" fontSize="11" fontWeight="bold" textAnchor="middle" className="fill-purple-600 dark:fill-purple-400 font-mono">Merge Commit</text>
          </svg>
        )}
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {mode === "rebase"
          ? "✨ Rebase: Giữ lịch sử commit gọn gàng, sạch sẽ, không tạo commit rác."
          : "🔀 Merge: Giữ nguyên lịch sử rẽ nhánh nhưng sinh thêm Merge commit kết nối."}
      </div>
    </div>
  );
};
