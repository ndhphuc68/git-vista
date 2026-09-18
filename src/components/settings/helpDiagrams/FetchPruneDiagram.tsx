import React, { useState } from "react";
import { Trash2, GitBranch, Cloud } from "lucide-react";

export const FetchPruneDiagram: React.FC = () => {
  const [pruned, setPruned] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Visual Canvas */}
      <div className="relative h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 flex flex-col justify-between p-3 overflow-hidden">
        {/* Remote status */}
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border-subtle/50">
          <div className="flex items-center gap-1.5 text-secondary font-medium">
            <Cloud size={14} className="text-blue-500 shrink-0" />
            <span>Remote (GitHub/GitLab):</span>
          </div>
          <span className="text-red-500 font-semibold line-through">
            origin/feature-old (đã xóa)
          </span>
        </div>

        {/* Local status */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-secondary font-medium">
            <GitBranch size={14} className="text-accent shrink-0" />
            <span>Máy cục bộ (Local):</span>
          </div>
          {pruned ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in">
              <span>Đã tự động dọn sạch ✨</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-500 font-bold animate-pulse">
              <span>origin/feature-old còn sót lại ⚠️</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-1.5 flex justify-center">
          <button
            type="button"
            onClick={() => setPruned(!pruned)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 transition-all cursor-pointer shadow-2xs"
          >
            <Trash2 size={13} />
            <span>{pruned ? "Hoàn tác mô phỏng" : "Bấm để mô phỏng Fetch --prune"}</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {pruned
          ? "✅ Nhánh rác trên máy tự động được dọn dẹp ngay khi bạn Fetch."
          : "⚠️ Nếu tắt Prune, các nhánh đã bị xóa trên server vẫn tích tụ lại trên máy."}
      </div>
    </div>
  );
};
