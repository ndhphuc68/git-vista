import React from "react";
import type { ChangeEvent, RefObject } from "react";
import { FolderOpen } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button, Input } from "../../../shared/ui";

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
        <Input
          size="md"
          mono
          ref={urlInputRef}
          id="clone-url"
          data-autofocus
          required
          disabled={isCloning}
          value={url}
          onChange={onUrlChange}
          placeholder={t.cloneModal.urlPlaceholder}
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
          <Input
            size="md"
            mono
            id="clone-target-dir"
            required
            disabled={isCloning}
            value={targetDir}
            onChange={(e) => onTargetDirChange(e.target.value)}
            placeholder={t.cloneModal.targetDirPlaceholder}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={onSelectFolder}
            disabled={isCloning}
            className="shrink-0"
          >
            <FolderOpen size={16} />
            <span>{t.cloneModal.selectFolder}</span>
          </Button>
        </div>
      </div>
    </>
  );
};
