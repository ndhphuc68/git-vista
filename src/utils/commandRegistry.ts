import { getTranslation } from "../i18n";

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
  openSettings?: () => void;
  fetch?: () => void | Promise<void>;
  pull?: () => void | Promise<void>;
  push?: () => void | Promise<void>;
  stageAll?: () => void | Promise<void>;
  commit?: () => void | Promise<void>;
  openManageRemotes?: () => void;
  openInteractiveRebase?: () => void;
  openCompare?: () => void;
  openCreatePullRequest?: () => void;
  openPullRequests?: () => void;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function getAppCommands(
  context: CommandContext,
  tParam?: ReturnType<typeof getTranslation>
): CommandItem[] {
  const t = tParam ?? getTranslation();
  const commands: CommandItem[] = [
    {
      id: "nav-history",
      title: t.palette.commands.navHistoryTitle,
      description: t.palette.commands.navHistoryDesc,
      category: "navigation",
      shortcut: "Ctrl+1",
      keywords: ["history", "lich su", "lịch sử", "commits", "nhat ky", "nhật ký", "graph"],
      action: () => context.navigate("history"),
    },
    {
      id: "nav-changes",
      title: t.palette.commands.navChangesTitle,
      description: t.palette.commands.navChangesDesc,
      category: "navigation",
      shortcut: "Ctrl+2",
      keywords: ["changes", "thay doi", "thay đổi", "diff", "working directory", "status"],
      action: () => context.navigate("changes"),
    },
    {
      id: "branch-create",
      title: t.palette.commands.branchCreateTitle,
      description: t.palette.commands.branchCreateDesc,
      category: "branch",
      shortcut: "Ctrl+B",
      keywords: ["branch", "nhanh", "nhánh", "tao nhanh", "tạo nhánh", "new branch"],
      action: () => context.openCreateBranch?.(),
    },
    {
      id: "git-fetch",
      title: t.palette.commands.gitFetchTitle,
      description: t.palette.commands.gitFetchDesc,
      category: "git",
      shortcut: "Ctrl+Shift+F",
      keywords: ["fetch", "lay ve", "lấy về", "remote", "dong bo", "đồng bộ"],
      action: () => context.fetch?.(),
    },
    {
      id: "git-pull",
      title: t.palette.commands.gitPullTitle,
      description: t.palette.commands.gitPullDesc,
      category: "git",
      shortcut: "Ctrl+Shift+P",
      keywords: ["pull", "keo ve", "kéo về", "cap nhat", "cập nhật", "update"],
      action: () => context.pull?.(),
    },
    {
      id: "git-push",
      title: t.palette.commands.gitPushTitle,
      description: t.palette.commands.gitPushDesc,
      category: "git",
      shortcut: "Ctrl+Shift+U",
      keywords: ["push", "day len", "đẩy lên", "upload"],
      action: () => context.push?.(),
    },
    {
      id: "git-stage-all",
      title: t.palette.commands.gitStageAllTitle,
      description: t.palette.commands.gitStageAllDesc,
      category: "git",
      shortcut: "Ctrl+Shift+A",
      keywords: ["stage", "stage all", "luu tat ca", "lưu tất cả", "đánh dấu tất cả", "danh dau", "add"],
      action: () => context.stageAll?.(),
    },
    {
      id: "git-commit",
      title: t.palette.commands.gitCommitTitle,
      description: t.palette.commands.gitCommitDesc,
      category: "git",
      shortcut: "Ctrl+Enter",
      keywords: ["commit", "ghi lai", "ghi lại", "tao commit", "tạo commit", "lưu thay đổi", "luu thay doi"],
      action: () => context.commit?.(),
    },
    {
      id: "git-manage-remotes",
      title: t.palette.commands.gitManageRemotesTitle,
      description: t.palette.commands.gitManageRemotesDesc,
      category: "git",
      keywords: ["remote", "may chu", "máy chủ", "origin", "upstream", "url", "prune", "don dep"],
      action: () => context.openManageRemotes?.(),
    },
    {
      id: "git-interactive-rebase",
      title: t.palette.commands.gitInteractiveRebaseTitle,
      description: t.palette.commands.gitInteractiveRebaseDesc,
      category: "git",
      keywords: ["rebase", "interactive", "tuong tac", "tương tác", "squash", "reword", "drop", "pick", "fixup"],
      action: () => context.openInteractiveRebase?.(),
    },
    {
      id: "git-compare",
      title: t.palette.commands.gitCompareTitle,
      description: t.palette.commands.gitCompareDesc,
      category: "git",
      keywords: ["compare", "so sanh", "so sánh", "diff", "branch", "commit", "merge-base", "two-dot", "three-dot"],
      action: () => context.openCompare?.(),
    },
    {
      id: "git-create-pr",
      title: t.palette.commands.gitCreatePrTitle,
      description: t.palette.commands.gitCreatePrDesc,
      category: "git",
      keywords: ["pr", "pull request", "github", "tao pr", "tạo pr", "create pr", "new pr"],
      action: () => context.openCreatePullRequest?.(),
    },
    {
      id: "git-view-prs",
      title: t.palette.commands.gitViewPrsTitle,
      description: t.palette.commands.gitViewPrsDesc,
      category: "git",
      keywords: ["pr", "pull requests", "github", "danh sach pr", "danh sách pr", "view prs"],
      action: () => context.openPullRequests?.(),
    },
    {
      id: "settings-theme",
      title: t.palette.commands.settingsThemeTitle,
      description: t.palette.commands.settingsThemeDesc,
      category: "settings",
      shortcut: "Ctrl+T",
      keywords: ["theme", "giao dien", "giao diện", "dark", "light", "sang", "sáng", "toi", "tối"],
      action: () => context.toggleTheme?.(),
    },
    {
      id: "settings-mode",
      title: t.palette.commands.settingsModeTitle,
      description: t.palette.commands.settingsModeDesc,
      category: "settings",
      keywords: ["mode", "simple", "advanced", "don gian", "đơn giản", "nang cao", "nâng cao", "che do", "chế độ"],
      action: () => context.toggleMode?.(),
    },
    {
      id: "settings-shortcuts",
      title: t.palette.commands.settingsShortcutsTitle,
      description: t.palette.commands.settingsShortcutsDesc,
      category: "settings",
      shortcut: "?",
      keywords: ["shortcuts", "help", "phim tat", "phím tắt", "tro giup", "trợ giúp", "?"],
      action: () => context.openShortcutsHelp?.(),
    },
    {
      id: "settings-open",
      title: t.settings.title,
      description: t.settings.description,
      category: "settings",
      shortcut: "Ctrl+,",
      keywords: ["settings", "cai dat", "cài đặt", "config", "profile", "author", "email", "theme"],
      action: () => context.openSettings?.(),
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
