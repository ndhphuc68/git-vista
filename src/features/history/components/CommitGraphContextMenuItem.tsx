import type { ComponentType } from "react";

interface CommitGraphContextMenuItemProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}

/** One action row inside the commit graph's right-click context menu. */
export function CommitGraphContextMenuItem({
  icon: Icon,
  label,
  onClick,
  className,
}: CommitGraphContextMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={
        "flex items-center gap-2.5 px-3.5 py-2 text-left text-primary hover:bg-surface-hover hover:text-link cursor-pointer whitespace-nowrap transition-colors" +
        (className ? ` ${className}` : "")
      }
    >
      <Icon size={14} className="shrink-0 text-secondary" />
      <span>{label}</span>
    </button>
  );
}
