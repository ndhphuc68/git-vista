import React from "react";
import type { UseCommandPaletteResult } from "./useCommandPalette";

export interface CommandPaletteFooterProps {
  t: UseCommandPaletteResult["t"];
  commandCount: number;
}

export const CommandPaletteFooter: React.FC<CommandPaletteFooterProps> = ({
  t,
  commandCount,
}) => (
  <div className="px-4 py-2 bg-surface-hover/50 border-t border-border-subtle flex items-center justify-between text-xs text-muted select-none">
    <div className="flex items-center gap-3">
      <span>
        <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
          ↑↓
        </kbd>{" "}
        {t.palette.navigateHint}
      </span>
      <span>
        <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
          Enter
        </kbd>{" "}
        {t.palette.executeHint}
      </span>
      <span>
        <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
          Esc
        </kbd>{" "}
        {t.palette.closeHint}
      </span>
    </div>
    <div className="text-[11px]">{t.palette.commandsCount.replace("{count}", String(commandCount))}</div>
  </div>
);
