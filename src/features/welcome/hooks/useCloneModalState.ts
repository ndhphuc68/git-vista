import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../../i18n";
import { listenToTaskProgress } from "../api";
import {
  createCloneCancelHandler,
  createCloneSelectFolderHandler,
  createCloneSubmitHandler,
  createCloneUrlChangeHandler,
} from "./useCloneModalState.actions";
import type { RepoSummary } from "../../../ipc/bindings.generated";

export interface UseCloneModalStateOptions {
  isOpen: boolean;
  onCloneSuccess: (repo: RepoSummary) => void;
  onClose: () => void;
}

/**
 * State, reset-on-open effect, progress-listener effect, and handlers for
 * `CloneModal`. Moved intact from the component body.
 */
export function useCloneModalState({ isOpen, onCloneSuccess, onClose }: UseCloneModalStateOptions) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [targetDir, setTargetDir] = useState("");
  const [baseDir, setBaseDir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("");
  const activeTaskIdRef = useRef<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTargetDir("");
      setBaseDir("");
      setError(null);
      setIsCloning(false);
      setProgressPercent(0);
      setStatusText("");
    }
  }, [isOpen]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    if (isOpen) {
      listenToTaskProgress((payload) => {
        if (payload.task_id === activeTaskIdRef.current) {
          setProgressPercent(payload.progress_percent);
          setStatusText(payload.status_text);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, [isOpen]);

  const fieldsContext = { baseDir, url, targetDir, setUrl, setBaseDir, setTargetDir };
  const handleUrlChange = createCloneUrlChangeHandler(fieldsContext);
  const handleSelectFolder = createCloneSelectFolderHandler(fieldsContext);

  const submitContext = {
    t,
    url,
    targetDir,
    isCloning,
    activeTaskIdRef,
    setError,
    setIsCloning,
    setProgressPercent,
    setStatusText,
    onCloneSuccess,
    onClose,
  };
  const handleCancel = createCloneCancelHandler(submitContext);
  const handleSubmit = createCloneSubmitHandler(submitContext);

  return {
    url,
    targetDir,
    setTargetDir,
    error,
    isCloning,
    progressPercent,
    statusText,
    urlInputRef,
    handleUrlChange,
    handleSelectFolder,
    handleCancel,
    handleSubmit,
  };
}
