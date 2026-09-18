import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const ConfirmationsDiagram: React.FC = () => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 p-3 flex items-center gap-3.5 select-none">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
          <ShieldCheck size={26} />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <span>Hộp thoại xác nhận an toàn</span>
          </div>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Ngăn chặn nguy cơ mất dữ liệu vĩnh viễn khi hủy bỏ thay đổi (Discard) hoặc đẩy cưỡng bức
            (Force Push) vô ý.
          </p>
        </div>
      </div>
      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        🔒 Giúp bảo vệ bạn khỏi các sai lầm không thể hoàn tác trong Git.
      </div>
    </div>
  );
};
