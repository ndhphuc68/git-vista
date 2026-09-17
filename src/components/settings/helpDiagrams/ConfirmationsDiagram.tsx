import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const ConfirmationsDiagram: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-20 w-full bg-surface/90 rounded-md border border-border-subtle/50 p-2 flex items-center gap-3 select-none">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
            <AlertTriangle size={12} className="text-amber-500" />
            <span>Hộp thoại xác nhận an toàn</span>
          </div>
          <p className="text-[10px] text-secondary mt-0.5 leading-snug">
            Bảo vệ bạn khỏi thao tác hủy bỏ code (Discard) hoặc đẩy đè nhánh (Force Push) vô tình gây mất dữ liệu.
          </p>
        </div>
      </div>
      <div className="text-[10px] text-secondary text-center italic">
        🔒 Giúp tránh các sai lầm không thể phục hồi trong Git.
      </div>
    </div>
  );
};
