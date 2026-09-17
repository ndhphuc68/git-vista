import React, { useState, useEffect } from "react";
import { Archive, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

export const AutostashDiagram: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* 3 Step Visual */}
      <div className="relative h-20 w-full bg-surface/80 rounded-md border border-border-subtle/50 flex items-center justify-around p-2 overflow-hidden">
        {/* Step 1: Code dở dang */}
        <div
          className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
            step === 1 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Archive size={16} />
          </div>
          <span className="text-[9px] font-medium text-primary">1. Cất Stash</span>
        </div>

        <ArrowRight size={12} className="text-secondary opacity-50" />

        {/* Step 2: Rebase */}
        <div
          className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
            step === 2 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <RefreshCw size={16} className={step === 2 ? "animate-spin" : ""} />
          </div>
          <span className="text-[9px] font-medium text-primary">2. Rebase</span>
        </div>

        <ArrowRight size={12} className="text-secondary opacity-50" />

        {/* Step 3: Pop Stash */}
        <div
          className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
            step === 3 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={16} />
          </div>
          <span className="text-[9px] font-medium text-primary">3. Dán lại code</span>
        </div>
      </div>

      <div className="text-[10px] text-secondary text-center italic">
        {step === 1 && "📦 Tự động cất code đang code dở trước khi cập nhật"}
        {step === 2 && "🔄 Kéo code mới về và xếp lại thứ tự commit an toàn"}
        {step === 3 && "✨ Áp dụng lại code dở dang của bạn, không bị mất bất kỳ dòng nào"}
      </div>
    </div>
  );
};
