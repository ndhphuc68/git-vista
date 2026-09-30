import { useState } from "react";
import { type RepoStateInfo } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { toErrorMessage } from "../../shared/utils/toError";

/**
 * State and handlers for InProgressOperationBanner's abort/continue actions.
 * Split out of the component so the JSX stays under the line-per-function limit;
 * hook call order matches the original inline `useState` calls exactly.
 */
export function useInProgressOperationBanner(
  repoState: RepoStateInfo | null | undefined,
  onAbort: (operation: string) => Promise<void>,
  onContinue: (operation: string) => Promise<void>
) {
  const { t } = useTranslation();
  const [isAborting, setIsAborting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAbort = async () => {
    if (!repoState) return;
    setIsAborting(true);
    setActionError(null);
    try {
      await onAbort(repoState.state);
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setActionError(t.banner.abortError.replace("{msg}", msg));
    } finally {
      setIsAborting(false);
    }
  };

  const handleContinue = async () => {
    if (!repoState || repoState.conflict_count > 0) return;
    setIsContinuing(true);
    setActionError(null);
    try {
      await onContinue(repoState.state);
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setActionError(t.banner.continueError.replace("{msg}", msg));
    } finally {
      setIsContinuing(false);
    }
  };

  return { t, isAborting, isContinuing, actionError, handleAbort, handleContinue };
}
