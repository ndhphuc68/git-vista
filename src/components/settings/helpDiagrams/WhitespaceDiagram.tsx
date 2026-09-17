import React, { useState } from "react";
import { EyeOff, Eye } from "lucide-react";

export const WhitespaceDiagram: React.FC = () => {
  const [ignore, setIgnore] = useState(true);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Switcher */}
      <div className="flex items-center justify-between bg-surface-active/70 p-1 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setIgnore(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            ignore
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <EyeOff size={14} />
          <span>Bật bỏ qua (Khuyên dùng)</span>
        </button>
        <button
          type="button"
          onClick={() => setIgnore(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            !ignore
              ? "bg-accent text-white shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Eye size={14} />
          <span>Tắt bỏ qua</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 p-3 font-mono text-xs flex flex-col justify-center select-none">
        {ignore ? (
          <div className="text-secondary font-sans font-medium text-center py-2 px-1 leading-relaxed">
            ✨ <span className="font-semibold text-primary">Không có thay đổi logic:</span> Đã tự động ẩn các sai khác về dấu cách / khoảng thụt lề Tab.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-2.5 py-1 rounded-md flex items-center justify-between">
              <span>- &nbsp;&nbsp;return true;</span>
              <span className="text-[10px] font-sans font-medium opacity-80">(2 dấu cách)</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md flex items-center justify-between font-bold">
              <span>+ &nbsp;&nbsp;&nbsp;&nbsp;return true;</span>
              <span className="text-[10px] font-sans font-medium opacity-80">(4 dấu cách)</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {ignore
          ? "🛡️ Ẩn các thay đổi thụt lề rác, giúp bạn chỉ tập trung vào logic code."
          : "🔍 Hiển thị toàn bộ từng dấu khoảng trắng và phím Tab bị lệch dòng."}
      </div>
    </div>
  );
};
