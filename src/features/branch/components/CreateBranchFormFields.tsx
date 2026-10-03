import React from "react";
import { BaseBranchSelect, type BaseBranchSelectProps } from "./BaseBranchSelect";

export interface CreateBranchFormFieldsProps {
  selectProps: BaseBranchSelectProps;
  nameLabel: string;
  namePlaceholder: string;
  branchName: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checkoutLabel: string;
  checkout: boolean;
  onCheckoutChange: (checked: boolean) => void;
  loading: boolean;
}

/** Form inputs for CreateBranchModal: base branch dropdown, branch name input and checkout checkbox. */
export const CreateBranchFormFields: React.FC<CreateBranchFormFieldsProps> = ({
  selectProps,
  nameLabel,
  namePlaceholder,
  branchName,
  onNameChange,
  checkoutLabel,
  checkout,
  onCheckoutChange,
  loading,
}) => (
  <>
    <BaseBranchSelect {...selectProps} />

    <div className="flex flex-col gap-1.5">
      <label htmlFor="branch-name-input" className="text-xs font-medium text-primary">
        {nameLabel}
      </label>
      <input
        id="branch-name-input"
        data-autofocus
        aria-label={nameLabel}
        type="text"
        placeholder={namePlaceholder}
        value={branchName}
        onChange={onNameChange}
        disabled={loading}
        className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full"
      />
    </div>

    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
      <input
        type="checkbox"
        checked={checkout}
        onChange={(e) => onCheckoutChange(e.target.checked)}
        disabled={loading}
        aria-label={checkoutLabel}
        className="accent-accent cursor-pointer rounded-sm"
      />
      <span>{checkoutLabel}</span>
    </label>
  </>
);
