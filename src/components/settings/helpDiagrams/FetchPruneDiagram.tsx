import React, { useState } from "react";
import { Trash2, GitBranch, Cloud } from "lucide-react";

export const FetchPruneDiagram: React.FC = () => {
  const [pruned, setPruned] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* SVG Canvas */}
      <div className="relative h-22 w-full bg-surface/80 rounded-md border border-border-subtle/50 flex flex-col justify-between p-2 overflow-hidden">
        {/* Remote status */}
        <div className="flex items-center justify-between text-[10px] pb-1 border-b border-border-subtle/40">
          <div className="flex items-center gap-1 text-secondary">
            <Cloud size={11} className="text-blue-500" />
            <span>Remote (GitHub/GitLab):</span>
          </div>
          <span className="text-red-500 font-medium line-through">origin/old-feature (đã xóa)</span>
        </div>

        {/* Local status */}
        <div className="flex items-center justify-between text-[10px] pt-1">
          <div className="flex items-center gap-1 text-secondary">
            <GitBranch size={11} className="text-accent" />
            <span>Máy cục bộ (Local):</span>
          </div>
          {pruned ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
              <span>Đã tự động xóa sạch</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-500 font-medium animate-pulse">
              <span>origin/old-feature còn sót</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-1 flex justify-center">
          <button
            type="button"
            onClick={() => setPruned(!pruned)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 transition-all cursor-pointer"
          >
            <Trash2 size={10} />
            <span>{pruned ? "Hoàn tác mô phỏng" : "Mô phỏng Fetch --prune"}</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-secondary text-center italic">
        {pruned
          ? "✅ Nhánh rác trên máy tự động được dọn dẹp ngay khi bạn Fetch."
          : "⚠️ Nếu tắt Prune, các nhánh đã bị xóa trên server vẫn tích tụ lại trên máy."}
      </div>
    </div>
  );
};
