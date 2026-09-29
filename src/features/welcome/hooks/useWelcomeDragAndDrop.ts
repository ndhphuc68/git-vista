import { useState } from "react";
import type { DragEvent } from "react";

/**
 * Drag-and-drop-to-open state and handlers for `WelcomeScreen`'s root
 * container. Moved intact from the component body.
 */
export function useWelcomeDragAndDrop(openRecent: (path: string) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        // Tauri's webview adds a non-standard absolute `path` to dropped files.
        const droppedPath = (file as File & { path?: string }).path || file.name;
        if (droppedPath) {
          openRecent(droppedPath);
        }
      }
    }
  };

  return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}
