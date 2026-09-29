import React from "react";
import type { ChangeEvent, RefObject } from "react";
import { FolderOpen } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface CloneModalFieldsProps {
  url: string;
  onUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
  urlInputRef: RefObject<HTMLInputElement | null>;
  targetDir: string;
  onTargetDirChange: (value: string) => void;
  onSelectFolder: () => void;
  isCloning: boolean;
}

/**
 * Repository URL and target directory fields in `CloneModal`. Extracted
 * from the component body, keeping the same markup verbatim.
 */
export const CloneModalFields: React.FC<CloneModalFieldsProps> = ({
  url,
  onUrlChange,
  urlInputRef,
  targetDir,
  onTargetDirChange,
  onSelectFolder,
  isCloning,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label
          htmlFor="clone-url"
          className="block text-xs sm:text-sm font-semibold text-primary mb-1.5"
        >
          {t.cloneModal.urlLabel}
        </label>
        <input
          ref={urlInputRef}
          id="clone-url"
          data-autofocus
          type="text"
          required
          disabled={isCloning}
          value={url}
          onChange={onUrlChange}
          placeholder={t.cloneModal.urlPlaceholder}
          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
        />
      </div>

      <div>
        <label
          htmlFor="clone-target-dir"
          className="block text-xs sm:text-sm font-semibold text-primary mb-1.5"
        >
          {t.cloneModal.targetDirLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="clone-target-dir"
            type="text"
            required
            disabled={isCloning}
            value={targetDir}
            onChange={(e) => onTargetDirChange(e.target.value)}
            placeholder={t.cloneModal.targetDirPlaceholder}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-window border border-border-subtle rounded-lg text-primary placeholder-tertiary focus:outline-none focus:border-accent disabled:opacity-50 font-mono"
          />
          <button
            type="button"
            onClick={onSelectFolder}
            disabled={isCloning}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-secondary hover:text-primary bg-window border border-border-subtle hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <FolderOpen size={16} />
            <span>{t.cloneModal.selectFolder}</span>
          </button>
        </div>
      </div>
    </>
  );
};
