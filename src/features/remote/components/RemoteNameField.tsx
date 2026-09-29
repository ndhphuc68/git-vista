import React from "react";
import type { RefObject } from "react";
import { useTranslation } from "../../../i18n";

const INPUT_CLASS =
  "px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary " +
  "placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 " +
  "focus:ring-accent/20 transition-all font-mono";

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
      <input
        id="remote-name-input"
        ref={nameInputRef}
        type="text"
        // When editing, the name is already filled in, so focus starts
        // on the URL — the field the user actually came to change.
        {...(isEdit ? {} : { "data-autofocus": true })}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t.modals.remotes.addModal.namePlaceholder}
        disabled={loading}
        className={INPUT_CLASS}
      />
    </div>
  );
};
