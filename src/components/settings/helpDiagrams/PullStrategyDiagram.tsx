import React, { useState } from "react";
import { GitMerge, GitPullRequest } from "lucide-react";
import { PullStrategyRebaseLane } from "./PullStrategyRebaseLane";
import { PullStrategyMergeLane } from "./PullStrategyMergeLane";
import { PULL_STRATEGY, type PullStrategy } from "../../../domain/enums";

export const PullStrategyDiagram: React.FC = () => {
  const [mode, setMode] = useState<Exclude<PullStrategy, typeof PULL_STRATEGY.INHERIT>>(
    PULL_STRATEGY.REBASE
  );

  return (
    <div className="flex flex-col gap-2.5">
      {/* Toggle tabs */}
      <div className="flex items-center justify-between bg-surface-active/70 p-1 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setMode(PULL_STRATEGY.REBASE)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mode === PULL_STRATEGY.REBASE
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <GitPullRequest size={14} />
          <span>Rebase (Tuyến tính)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode(PULL_STRATEGY.MERGE)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mode === PULL_STRATEGY.MERGE
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
        {mode === PULL_STRATEGY.REBASE ? <PullStrategyRebaseLane /> : <PullStrategyMergeLane />}
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {mode === PULL_STRATEGY.REBASE
          ? "✨ Rebase: Giữ lịch sử commit gọn gàng, sạch sẽ, không tạo commit rác."
          : "🔀 Merge: Giữ nguyên lịch sử rẽ nhánh nhưng sinh thêm Merge commit kết nối."}
      </div>
    </div>
  );
};
