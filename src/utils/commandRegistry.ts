export type CommandCategory = "navigation" | "git" | "branch" | "settings";

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  keywords?: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
}

export interface CommandContext {
  repoPath?: string | null;
  navigate: (screen: "history" | "changes" | "conflict") => void;
  openCreateBranch?: () => void;
  openShortcutsHelp?: () => void;
  toggleTheme?: () => void;
  toggleMode?: () => void;
  fetch?: () => void | Promise<void>;
  pull?: () => void | Promise<void>;
  push?: () => void | Promise<void>;
  stageAll?: () => void | Promise<void>;
  commit?: () => void | Promise<void>;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function getAppCommands(context: CommandContext): CommandItem[] {
  const commands: CommandItem[] = [
    {
      id: "nav-history",
      title: "Chuyển sang Lịch sử commit",
      description: "Chuyển sang màn hình xem lịch sử commit và cây nhánh",
      category: "navigation",
      shortcut: "Ctrl+1",
      keywords: ["history", "lich su", "commits", "nhat ky", "graph"],
      action: () => context.navigate("history"),
    },
    {
      id: "nav-changes",
      title: "Xem các thay đổi tập tin",
      description: "Chuyển sang màn hình quản lý thay đổi và commit",
      category: "navigation",
      shortcut: "Ctrl+2",
      keywords: ["changes", "thay doi", "diff", "working directory", "status"],
      action: () => context.navigate("changes"),
    },
    {
      id: "branch-create",
      title: "Tạo nhánh mới",
      description: "Mở hộp thoại tạo nhánh Git mới",
      category: "branch",
      shortcut: "Ctrl+B",
      keywords: ["branch", "nhanh", "tao nhanh", "new branch"],
      action: () => context.openCreateBranch?.(),
    },
    {
      id: "git-fetch",
      title: "Lấy về (Fetch)",
      description: "Cập nhật thông tin mới nhất từ máy chủ từ xa",
      category: "git",
      shortcut: "Ctrl+Shift+F",
      keywords: ["fetch", "lay ve", "remote", "dong bo"],
      action: () => context.fetch?.(),
    },
    {
      id: "git-pull",
      title: "Kéo về (Pull)",
      description: "Kéo và gộp các commit mới từ máy chủ về nhánh hiện tại",
      category: "git",
      shortcut: "Ctrl+Shift+P",
      keywords: ["pull", "keo ve", "cap nhat", "update"],
      action: () => context.pull?.(),
    },
    {
      id: "git-push",
      title: "Đẩy lên (Push)",
      description: "Đẩy các commit ở nhánh hiện tại lên máy chủ từ xa",
      category: "git",
      shortcut: "Ctrl+Shift+U",
      keywords: ["push", "day len", "upload"],
      action: () => context.push?.(),
    },
    {
      id: "git-stage-all",
      title: "Stage tất cả thay đổi",
      description: "Đưa tất cả tập tin thay đổi vào khu vực chuẩn bị commit",
      category: "git",
      shortcut: "Ctrl+Shift+A",
      keywords: ["stage", "stage all", "luu tat ca", "add"],
      action: () => context.stageAll?.(),
    },
    {
      id: "git-commit",
      title: "Tạo commit",
      description: "Lưu các thay đổi đã stage thành commit mới",
      category: "git",
      shortcut: "Ctrl+Enter",
      keywords: ["commit", "ghi lai", "tao commit"],
      action: () => context.commit?.(),
    },
    {
      id: "settings-theme",
      title: "Chuyển đổi giao diện Sáng / Tối",
      description: "Chuyển đổi màu sắc giao diện giữa Dark và Light theme",
      category: "settings",
      shortcut: "Ctrl+T",
      keywords: ["theme", "giao dien", "dark", "light", "sang", "toi"],
      action: () => context.toggleTheme?.(),
    },
    {
      id: "settings-mode",
      title: "Chuyển chế độ Đơn giản / Nâng cao",
      description: "Chuyển đổi giữa chế độ Simple và Advanced",
      category: "settings",
      keywords: ["mode", "simple", "advanced", "don gian", "nang cao", "che do"],
      action: () => context.toggleMode?.(),
    },
    {
      id: "settings-shortcuts",
      title: "Bảng phím tắt trợ giúp",
      description: "Hiển thị bảng tra cứu tất cả phím tắt trong ứng dụng",
      category: "settings",
      shortcut: "?",
      keywords: ["shortcuts", "help", "phim tat", "tro giup", "?"],
      action: () => context.openShortcutsHelp?.(),
    },
  ];

  return commands;
}

export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) return commands;

  const normalizedQuery = normalizeText(trimmed);

  return commands.filter((cmd) => {
    const titleNorm = normalizeText(cmd.title);
    const descNorm = cmd.description ? normalizeText(cmd.description) : "";
    const categoryNorm = normalizeText(cmd.category);
    const idNorm = normalizeText(cmd.id);
    const keywordsNorm = cmd.keywords ? cmd.keywords.map(normalizeText).join(" ") : "";

    return (
      titleNorm.includes(normalizedQuery) ||
      descNorm.includes(normalizedQuery) ||
      categoryNorm.includes(normalizedQuery) ||
      idNorm.includes(normalizedQuery) ||
      keywordsNorm.includes(normalizedQuery)
    );
  });
}
