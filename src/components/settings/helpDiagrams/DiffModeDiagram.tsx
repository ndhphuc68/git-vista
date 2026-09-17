import React, { useState } from "react";
import { Columns, AlignLeft } from "lucide-react";

export const DiffModeDiagram: React.FC = () => {
  const [view, setView] = useState<"split" | "unified">("split");

  return (
    <div className="flex flex-col gap-2">
      {/* Switcher */}
      <div className="flex items-center justify-between bg-surface-active/60 p-0.5 rounded-md text-[10px]">
        <button
          type="button"
          onClick={() => setView("split")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            view === "split"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Columns size={11} />
          <span>Side-by-side (2 Cột)</span>
        </button>
        <button
          type="button"
          onClick={() => setView("unified")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            view === "unified"
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <AlignLeft size={11} />
          <span>Unified (1 Cột liền mạch)</span>
        </button>
      </div>

      {/* Mini preview container */}
      <div className="h-20 w-full bg-surface/90 rounded-md border border-border-subtle/50 p-1.5 font-mono text-[9px] flex flex-col justify-center select-none">
        {view === "split" ? (
          <div className="grid grid-cols-2 gap-1.5 h-full">
            {/* Left Col (Old) */}
            <div className="bg-red-500/10 border border-red-500/20 rounded p-1 flex flex-col justify-center">
              <span className="text-secondary opacity-60 text-[8px] font-sans">Bản cũ:</span>
              <span className="text-red-500">- const status = 0;</span>
            </div>
            {/* Right Col (New) */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1 flex flex-col justify-center">
              <span className="text-secondary opacity-60 text-[8px] font-sans">Bản mới:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ const status = 1;</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 h-full justify-center px-1">
            <div className="bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 text-red-500">
              - const status = 0;
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
              + const status = 1;
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-secondary text-center italic">
        {view === "split"
          ? "👀 Side-by-side: Thích hợp màn hình rộng, đối chiếu dòng cũ và mới trực quan."
          : "📜 Unified: Gọn gàng trên màn hình nhỏ hoặc khi xem diff nhanh."}
      </div>
    </div>
  );
};
