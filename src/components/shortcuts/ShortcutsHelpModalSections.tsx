import React from "react";
import type { ShortcutSection } from "./shortcutsHelpSections";

export interface ShortcutsHelpModalSectionsProps {
  sections: ShortcutSection[];
}

export const ShortcutsHelpModalSections: React.FC<ShortcutsHelpModalSectionsProps> = ({
  sections,
}) => (
  <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
    {sections.map((section) => (
      <div
        key={section.title}
        className="bg-window/50 rounded-lg p-3.5 border border-border-subtle/50 flex flex-col gap-2.5"
      >
        <h3 className="text-xs font-semibold text-accent uppercase tracking-wider m-0">
          {section.title}
        </h3>
        <div className="flex flex-col gap-2">
          {section.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-primary truncate">{item.label}</span>
              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, idx) => (
                  <React.Fragment key={k}>
                    {idx > 0 && <span className="text-secondary text-[10px]">/</span>}
                    <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-primary bg-surface border border-border-subtle rounded shadow-xs">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
