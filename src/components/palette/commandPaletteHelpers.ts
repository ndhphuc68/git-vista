import type { CommandCategory, CommandItem } from "../../utils/commandRegistry";

export interface CommandCategoryGroup {
  category: CommandCategory;
  label: string;
  items: { command: CommandItem; flatIndex: number }[];
}

/**
 * Groups a flat, already-filtered command list by category while preserving
 * the flat index each command had in the original list (used for keyboard
 * navigation / selection highlighting).
 */
export function groupCommandsByCategory(
  filteredCommands: CommandItem[],
  categoryLabels: Record<CommandCategory, string>
): CommandCategoryGroup[] {
  const categoryMap = new Map<CommandCategory, { command: CommandItem; flatIndex: number }[]>();

  filteredCommands.forEach((cmd, idx) => {
    const list = categoryMap.get(cmd.category) || [];
    list.push({ command: cmd, flatIndex: idx });
    categoryMap.set(cmd.category, list);
  });

  const categories: CommandCategoryGroup[] = [];
  categoryMap.forEach((items, cat) => {
    categories.push({
      category: cat,
      label: categoryLabels[cat] || cat,
      items,
    });
  });

  return categories;
}
