import React, { useState } from "react";
import { Columns, AlignLeft } from "lucide-react";

export const DiffModeDiagram: React.FC = () => {
  const [view, setView] = useState<"split" | "unified">("split");

  return (
    <div className="flex flex-col gap-2.5">
      {/* Switcher */}
      <div className="flex items-center justify-between bg-surface-active/70 p-1 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setView("split")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            view === "split"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Columns size={14} />
          <span>Side-by-side (2 Cột)</span>
        </button>
        <button
          type="button"
          onClick={() => setView("unified")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            view === "unified"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <AlignLeft size={14} />
          <span>Unified (1 Cột liền mạch)</span>
        </button>
      </div>

      {/* Mini preview container */}
      <div className="h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 p-2.5 font-mono text-xs flex flex-col justify-center select-none">
        {view === "split" ? (
          <div className="grid grid-cols-2 gap-2 h-full">
            {/* Left Col (Old) */}
            <div className="bg-red-500/10 border border-red-500/25 rounded-md p-2 flex flex-col justify-center">
              <span className="text-secondary opacity-75 text-[10px] font-sans font-medium mb-0.5">Bản cũ (Trước):</span>
              <span className="text-red-500 font-semibold">- const status = 0;</span>
            </div>
            {/* Right Col (New) */}
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-md p-2 flex flex-col justify-center">
              <span className="text-secondary opacity-75 text-[10px] font-sans font-medium mb-0.5">Bản mới (Sau):</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ const status = 1;</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 h-full justify-center px-2">
            <div className="bg-red-500/10 border border-red-500/25 rounded-md px-2.5 py-1 text-red-500 font-semibold">
              - const status = 0;
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-md px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-bold">
              + const status = 1;
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {view === "split"
          ? "👀 Side-by-side: Thích hợp màn hình rộng, đối chiếu dòng cũ và mới trực quan song song."
          : "📜 Unified: Gọn gàng trên màn hình nhỏ hoặc khi lướt xem nhanh các thay đổi ngắn."}
      </div>
    </div>
  );
};
