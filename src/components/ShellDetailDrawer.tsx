import React from "react";
import clsx from "clsx";
import { CommitDetailPanel } from "../features/history";

interface ShellDetailDrawerProps {
  detailPanelOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

/** The Shell's right-hand commit detail slide-in drawer and its backdrop. */
export const ShellDetailDrawer: React.FC<ShellDetailDrawerProps> = ({
  detailPanelOpen,
  isMobile,
  onClose,
}) => {
  if (!detailPanelOpen) return null;

  return (
    <>
      <div
        data-testid="detail-backdrop"
        onClick={onClose}
        className="absolute inset-0 modal-backdrop z-30 animate-fade-in"
      />
      <div
        data-testid="shell-detail-container"
        className={clsx(
          "absolute top-0 right-0 bottom-0 z-40 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-macos flex flex-col overflow-hidden animate-slide-up",
          isMobile ? "w-full max-w-full" : "w-3/4 max-w-[85vw]"
        )}
      >
        <CommitDetailPanel onClose={onClose} />
      </div>
    </>
  );
};
