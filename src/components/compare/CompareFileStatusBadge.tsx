import React from "react";
import { getFileStatusBadge } from "./compareFileStatusBadgeHelpers";

interface CompareFileStatusBadgeProps {
  status: string;
}

export const CompareFileStatusBadge: React.FC<CompareFileStatusBadgeProps> = ({ status }) => {
  const badge = getFileStatusBadge(status);
  return (
    <span
      className={`flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold ${badge.className}`}
      title={badge.title}
    >
      {badge.letter}
    </span>
  );
};
