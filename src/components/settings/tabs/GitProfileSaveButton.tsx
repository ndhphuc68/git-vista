import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface GitProfileSaveButtonProps {
  saving: boolean;
  disabled: boolean;
}

/** Submit button for the git profile form. */
export const GitProfileSaveButton: React.FC<GitProfileSaveButtonProps> = ({ saving, disabled }) => {
  const { t } = useTranslation();

  return (
    <div className="pt-2 flex justify-end">
      <Button variant="primary" type="submit" data-testid="save-profile-btn" disabled={disabled}>
        <Check size={14} />
        <span>{saving ? t.common.loading : t.settings.profile.saveBtn}</span>
      </Button>
    </div>
  );
};
