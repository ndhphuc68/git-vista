import { useState, useRef } from "react";

/**
 * PR title/body/draft form-field state for CreatePullRequestModal, plus the
 * submitting/pushing/error state shared by its submit and push-branch handlers.
 */
export function useCreatePullRequestModalForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (error) setError(null);
  };

  return {
    title,
    setTitle,
    body,
    setBody,
    isDraft,
    setIsDraft,
    submitting,
    setSubmitting,
    isPushing,
    setIsPushing,
    error,
    setError,
    titleInputRef,
    handleTitleChange,
  };
}
