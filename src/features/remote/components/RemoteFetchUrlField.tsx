import React from "react";
import type { RefObject } from "react";
import { useTranslation } from "../../../i18n";

const INPUT_CLASS =
  "px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary " +
  "placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 " +
  "focus:ring-accent/20 transition-all font-mono";

export interface RemoteFetchUrlFieldProps {
  fetchUrl: string;
  onFetchUrlChange: (value: string) => void;
  isEdit: boolean;
  loading: boolean;
  fetchUrlInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Fetch URL field in `AddEditRemoteModal`. Extracted from the component
 * body, keeping the same markup verbatim.
 */
export const RemoteFetchUrlField: React.FC<RemoteFetchUrlFieldProps> = ({
  fetchUrl,
  onFetchUrlChange,
  isEdit,
  loading,
  fetchUrlInputRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="remote-fetch-url-input" className="text-xs font-semibold text-primary">
        {t.modals.remotes.addModal.fetchUrlLabel} <span className="text-red-500">*</span>
      </label>
      <input
        id="remote-fetch-url-input"
        ref={fetchUrlInputRef}
        type="text"
        {...(isEdit ? { "data-autofocus": true } : {})}
        value={fetchUrl}
        onChange={(e) => onFetchUrlChange(e.target.value)}
        placeholder={t.modals.remotes.addModal.fetchUrlPlaceholder}
        disabled={loading}
        className={INPUT_CLASS}
      />
    </div>
  );
};
