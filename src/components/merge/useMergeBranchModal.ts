import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";

/**
 * State and submit handler for MergeBranchModal. Split out of the component
 * so its JSX stays under the line-per-function limit; hook call order matches
 * the original inline `useState`/`useEffect` calls exactly.
 */
export function useMergeBranchModal(
  isOpen: boolean,
  onMerge: (noFf: boolean) => Promise<{ success: boolean; status: string; output: string }>,
  onClose: () => void
) {
  const { t } = useTranslation();
  const [noFf, setNoFf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNoFf(false);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  const handleMergeSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onMerge(noFf);
      if (res.success) {
        onClose();
      } else {
        if (res.status === "Conflict") {
          setError(t.modals.merge.conflictError);
        } else {
          setError(res.output || t.modals.merge.genericError.replace("{msg}", res.status));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(t.modals.merge.genericError.replace("{msg}", msg));
    } finally {
      setLoading(false);
    }
  };

  return { t, noFf, setNoFf, loading, error, handleMergeSubmit };
}
