import React from "react";
import type { RefObject } from "react";
import { useTranslation } from "../../../i18n";
import { Input } from "../../../shared/ui";

export interface RemoteNameFieldProps {
  name: string;
  onNameChange: (value: string) => void;
  isEdit: boolean;
  loading: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Remote name field in `AddEditRemoteModal`. Extracted from the component
 * body, keeping the same markup verbatim.
 */
export const RemoteNameField: React.FC<RemoteNameFieldProps> = ({
  name,
  onNameChange,
  isEdit,
  loading,
  nameInputRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="remote-name-input" className="text-xs font-semibold text-primary">
        {t.modals.remotes.addModal.nameLabel} <span className="text-red-500">*</span>
      </label>
      <Input
        size="md"
        mono
        id="remote-name-input"
        ref={nameInputRef}
        // When editing, the name is already filled in, so focus starts
        // on the URL — the field the user actually came to change.
        {...(isEdit ? {} : { "data-autofocus": true })}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t.modals.remotes.addModal.namePlaceholder}
        disabled={loading}
      />
    </div>
  );
};
