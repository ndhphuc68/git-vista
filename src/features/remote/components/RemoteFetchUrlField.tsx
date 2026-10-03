import React from "react";
import type { RefObject } from "react";
import { useTranslation } from "../../../i18n";
import { Input } from "../../../shared/ui";

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
      <Input
        size="md"
        mono
        id="remote-fetch-url-input"
        ref={fetchUrlInputRef}
        {...(isEdit ? { "data-autofocus": true } : {})}
        value={fetchUrl}
        onChange={(e) => onFetchUrlChange(e.target.value)}
        placeholder={t.modals.remotes.addModal.fetchUrlPlaceholder}
        disabled={loading}
      />
    </div>
  );
};
