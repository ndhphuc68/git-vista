import React from "react";
import { Edit3 } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface RebaseMessageEditorProps {
  isSquash: boolean;
  currentMessage: string;
  onMessageChange: (message: string) => void;
}

export const RebaseMessageEditor: React.FC<RebaseMessageEditorProps> = ({
  isSquash,
  currentMessage,
  onMessageChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-2.5 pt-2.5 border-t border-border-subtle/70 pl-8 pr-1 flex flex-col gap-1 animate-fade-in">
      <div className="flex items-center justify-between text-[11px] text-secondary">
        <span className="flex items-center gap-1 font-medium text-accent">
          <Edit3 size={11} />
          {isSquash
            ? t.modals.interactiveRebase.actions.squashDesc
            : t.modals.interactiveRebase.actions.rewordDesc}
        </span>
        <span className="font-mono text-[10px] opacity-75">{currentMessage.length} chars</span>
      </div>
      <textarea
        rows={3}
        value={currentMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder={t.modals.interactiveRebase.editMessagePlaceholder}
        className="w-full text-xs font-mono p-2 rounded bg-surface-subtle border border-border-subtle focus:border-accent focus:ring-1 focus:ring-accent outline-none text-primary resize-y leading-relaxed"
      />
    </div>
  );
};
