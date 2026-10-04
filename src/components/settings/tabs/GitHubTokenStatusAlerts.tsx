import React from "react";
import { Alert } from "../../../shared/ui";

export interface GitHubTokenStatusAlertsProps {
  errorMessage: string | null;
  successMessage: string | null;
}

/** Error/success alerts shown below the GitHub token action buttons. */
export const GitHubTokenStatusAlerts: React.FC<GitHubTokenStatusAlertsProps> = ({
  errorMessage,
  successMessage,
}) => (
  <>
    {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
    {successMessage && <Alert variant="success">{successMessage}</Alert>}
  </>
);
