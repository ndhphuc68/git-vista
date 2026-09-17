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
    <div className="flex flex-col gap-2.5">
      {/* 3 Step Visual */}
      <div className="relative h-28 w-full bg-surface/90 rounded-lg border border-border-subtle/70 flex items-center justify-around p-3 overflow-hidden">
        {/* Step 1: Code dở dang */}
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            step === 1 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-500 shadow-2xs">
            <Archive size={20} />
          </div>
          <span className="text-xs font-bold text-primary">1. Cất Stash</span>
        </div>

        <ArrowRight size={15} className="text-secondary opacity-60" />

        {/* Step 2: Rebase */}
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            step === 2 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-500 shadow-2xs">
            <RefreshCw size={20} className={step === 2 ? "animate-spin" : ""} />
          </div>
          <span className="text-xs font-bold text-primary">2. Rebase</span>
        </div>

        <ArrowRight size={15} className="text-secondary opacity-60" />

        {/* Step 3: Pop Stash */}
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            step === 3 ? "opacity-100 scale-105" : "opacity-40 scale-95"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-500 shadow-2xs">
            <CheckCircle2 size={20} />
          </div>
          <span className="text-xs font-bold text-primary">3. Dán lại code</span>
        </div>
      </div>

      <div className="text-xs text-primary font-medium text-center bg-surface-header/60 py-1.5 px-2 rounded-md">
        {step === 1 && "📦 Tự động cất code đang viết dở trước khi cập nhật"}
        {step === 2 && "🔄 Kéo commit mới về và xếp lại thứ tự commit an toàn"}
        {step === 3 && "✨ Bung lại code dở dang của bạn, không bị mất bất kỳ dòng nào"}
      </div>
    </div>
  );
};
