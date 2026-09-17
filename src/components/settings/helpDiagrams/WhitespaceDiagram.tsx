import React, { useState } from "react";
import { EyeOff, Eye } from "lucide-react";

export const WhitespaceDiagram: React.FC = () => {
  const [ignore, setIgnore] = useState(true);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between bg-surface-active/60 p-0.5 rounded-md text-[10px]">
        <button
          type="button"
          onClick={() => setIgnore(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            ignore
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <EyeOff size={11} />
          <span>Bật bỏ qua (Khuyên dùng)</span>
        </button>
        <button
          type="button"
          onClick={() => setIgnore(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
            !ignore
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Eye size={11} />
          <span>Tắt bỏ qua</span>
        </button>
      </div>

      <div className="h-18 w-full bg-surface/90 rounded-md border border-border-subtle/50 p-2 font-mono text-[9px] flex flex-col justify-center select-none">
        {ignore ? (
          <div className="text-secondary opacity-75 italic text-center py-1">
            ✨ Không có thay đổi logic nào (đã ẩn các thay đổi về dấu cách / tab)
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="bg-red-500/10 text-red-500 px-1 py-0.5 rounded">
              - &nbsp;&nbsp;return true; <span className="text-[8px] opacity-70">(2 dấu cách)</span>
            </div>
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded">
              + &nbsp;&nbsp;&nbsp;&nbsp;return true; <span className="text-[8px] opacity-70">(4 dấu cách)</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-secondary text-center italic">
        {ignore
          ? "🛡️ Ẩn các thay đổi thụt lề, tránh làm loãng nội dung review code."
          : "🔍 Hiển thị toàn bộ từng dấu khoảng trắng và dấu Tab bị lệch."}
      </div>
    </div>
  );
};
