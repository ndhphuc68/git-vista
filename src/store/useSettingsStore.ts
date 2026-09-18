import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type Locale = "vi" | "en";
export type AppMode = "simple" | "advanced";
export type SettingsTab = "profile" | "appearance" | "diff" | "behavior" | "tools" | "github";

export type DateFormat = "relative" | "absolute";
export type AvatarStyle = "initials" | "gravatar" | "none";
export type DiffViewMode = "split" | "unified";
export type DiffFontSize = 12 | 13 | 14 | 16;
export type DiffTabSize = 2 | 4 | 8;
export type ExternalEditor = "code" | "cursor" | "subl" | "notepad++" | "custom";
export type ExternalTerminal = "wt" | "powershell" | "cmd" | "bash";
export type DefaultEditor = ExternalEditor;
export type DefaultTerminal = ExternalTerminal;
export type CommitMessageLimit = 0 | 50 | 72;

interface SettingsState {
  theme: Theme;
  colorblind: boolean;
  locale: Locale;
  mode: AppMode;
  isSettingsOpen: boolean;
  activeTab: SettingsTab;
  resolvedTheme: "light" | "dark";

  // Appearance & Display
  dateFormat: DateFormat;
  avatarStyle: AvatarStyle;

  // Diff & Viewer
  diffViewMode: DiffViewMode;
  diffFontSize: DiffFontSize;
  diffIgnoreWhitespace: boolean;
  diffTabSize: DiffTabSize;
  diffShowLineNumbers: boolean;

  // Safety Confirmations
  confirmDiscard: boolean;
  confirmDeleteBranch: boolean;
  confirmForcePush: boolean;

  // Commit Conventions
  commitMessageLimit: number;

  // External Tools
  defaultEditor: ExternalEditor;
  customEditorCommand: string;
  defaultTerminal: ExternalTerminal;

  // Actions
  setTheme: (theme: Theme) => void;
  setColorblind: (enabled: boolean) => void;
  setLocale: (locale: Locale) => void;
  setMode: (mode: AppMode) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;

  setDateFormat: (format: DateFormat) => void;
  setAvatarStyle: (style: AvatarStyle) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
  setDiffFontSize: (size: DiffFontSize) => void;
  setDiffIgnoreWhitespace: (ignore: boolean) => void;
  setDiffTabSize: (size: DiffTabSize) => void;
  setDiffShowLineNumbers: (show: boolean) => void;
  setConfirmDiscard: (confirm: boolean) => void;
  setConfirmDeleteBranch: (confirm: boolean) => void;
  setConfirmForcePush: (confirm: boolean) => void;
  setCommitMessageLimit: (limit: number) => void;
  setDefaultEditor: (editor: ExternalEditor) => void;
  setCustomEditorCommand: (cmd: string) => void;
  setDefaultTerminal: (terminal: ExternalTerminal) => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeAttributes(theme: "light" | "dark", colorblind: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-colorblind", colorblind ? "true" : "false");
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const getStorage = (key: string, fallback: string) => {
    if (typeof localStorage === "undefined") return fallback;
    return localStorage.getItem(key) ?? fallback;
  };

  const savedTheme = getStorage("theme", "system") as Theme;
  const savedColorblind = getStorage("colorblind", "false") === "true";
  const savedLocale = getStorage("locale", "vi") as Locale;
  const savedMode = getStorage("mode", "simple") as AppMode;

  const savedDateFormat = getStorage("gitvista_date_format", "relative") as DateFormat;
  const savedAvatarStyle = getStorage("gitvista_avatar_style", "initials") as AvatarStyle;
  const savedDiffViewMode = getStorage("gitvista_diff_view_mode", "unified") as DiffViewMode;
  const savedDiffFontSize = parseInt(
    getStorage("gitvista_diff_font_size", "13"),
    10
  ) as DiffFontSize;
  const savedDiffIgnoreWhitespace =
    getStorage("gitvista_diff_ignore_whitespace", "false") === "true";
  const savedDiffTabSize = parseInt(getStorage("gitvista_diff_tab_size", "4"), 10) as DiffTabSize;
  const savedDiffShowLineNumbers = getStorage("gitvista_diff_show_line_numbers", "true") === "true";
  const savedConfirmDiscard = getStorage("gitvista_confirm_discard", "true") === "true";
  const savedConfirmDeleteBranch = getStorage("gitvista_confirm_delete_branch", "true") === "true";
  const savedConfirmForcePush = getStorage("gitvista_confirm_force_push", "true") === "true";
  const savedCommitMessageLimit = parseInt(getStorage("gitvista_commit_message_limit", "72"), 10);
  const savedDefaultEditor = getStorage("gitvista_default_editor", "code") as ExternalEditor;
  const savedCustomEditorCommand = getStorage("gitvista_custom_editor_command", "");
  const savedDefaultTerminal = getStorage(
    "gitvista_default_terminal",
    "powershell"
  ) as ExternalTerminal;

  const resolved = savedTheme === "system" ? getSystemTheme() : savedTheme;
  applyThemeAttributes(resolved, savedColorblind);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", savedLocale);
  }

  // Lắng nghe sự thay đổi của OS theme nếu đang ở chế độ system
  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      const state = get();
      if (state.theme === "system") {
        const newResolved = getSystemTheme();
        set({ resolvedTheme: newResolved });
        applyThemeAttributes(newResolved, state.colorblind);
      }
    });
  }

  return {
    theme: savedTheme,
    colorblind: savedColorblind,
    locale: savedLocale,
    mode: savedMode,
    resolvedTheme: resolved,

    dateFormat: savedDateFormat,
    avatarStyle: savedAvatarStyle,
    diffViewMode: savedDiffViewMode,
    diffFontSize: savedDiffFontSize,
    diffIgnoreWhitespace: savedDiffIgnoreWhitespace,
    diffTabSize: savedDiffTabSize,
    diffShowLineNumbers: savedDiffShowLineNumbers,
    confirmDiscard: savedConfirmDiscard,
    confirmDeleteBranch: savedConfirmDeleteBranch,
    confirmForcePush: savedConfirmForcePush,
    commitMessageLimit: savedCommitMessageLimit,
    defaultEditor: savedDefaultEditor,
    customEditorCommand: savedCustomEditorCommand,
    defaultTerminal: savedDefaultTerminal,

    setTheme: (theme: Theme) => {
      const resolved = theme === "system" ? getSystemTheme() : theme;
      if (typeof localStorage !== "undefined") localStorage.setItem("theme", theme);
      applyThemeAttributes(resolved, get().colorblind);
      set({ theme, resolvedTheme: resolved });
    },

    setColorblind: (colorblind: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("colorblind", String(colorblind));
      applyThemeAttributes(get().resolvedTheme, colorblind);
      set({ colorblind });
    },

    setLocale: (locale: Locale) => {
      if (typeof localStorage !== "undefined") localStorage.setItem("locale", locale);
      if (typeof document !== "undefined") document.documentElement.setAttribute("lang", locale);
      set({ locale });
    },

    setMode: (mode: AppMode) => {
      if (typeof localStorage !== "undefined") localStorage.setItem("mode", mode);
      set({ mode });
    },

    isSettingsOpen: false,
    activeTab: "profile",
    openSettings: (tab = "profile") => set({ isSettingsOpen: true, activeTab: tab }),
    closeSettings: () => set({ isSettingsOpen: false }),
    setActiveTab: (tab: SettingsTab) => set({ activeTab: tab }),

    setDateFormat: (dateFormat: DateFormat) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_date_format", dateFormat);
      set({ dateFormat });
    },

    setAvatarStyle: (avatarStyle: AvatarStyle) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_avatar_style", avatarStyle);
      set({ avatarStyle });
    },

    setDiffViewMode: (diffViewMode: DiffViewMode) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_diff_view_mode", diffViewMode);
      set({ diffViewMode });
    },

    setDiffFontSize: (diffFontSize: DiffFontSize) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_diff_font_size", String(diffFontSize));
      set({ diffFontSize });
    },

    setDiffIgnoreWhitespace: (diffIgnoreWhitespace: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_diff_ignore_whitespace", String(diffIgnoreWhitespace));
      set({ diffIgnoreWhitespace });
    },

    setDiffTabSize: (diffTabSize: DiffTabSize) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_diff_tab_size", String(diffTabSize));
      set({ diffTabSize });
    },

    setDiffShowLineNumbers: (diffShowLineNumbers: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_diff_show_line_numbers", String(diffShowLineNumbers));
      set({ diffShowLineNumbers });
    },

    setConfirmDiscard: (confirmDiscard: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_confirm_discard", String(confirmDiscard));
      set({ confirmDiscard });
    },

    setConfirmDeleteBranch: (confirmDeleteBranch: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_confirm_delete_branch", String(confirmDeleteBranch));
      set({ confirmDeleteBranch });
    },

    setConfirmForcePush: (confirmForcePush: boolean) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_confirm_force_push", String(confirmForcePush));
      set({ confirmForcePush });
    },

    setCommitMessageLimit: (commitMessageLimit: number) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_commit_message_limit", String(commitMessageLimit));
      set({ commitMessageLimit });
    },

    setDefaultEditor: (defaultEditor: ExternalEditor) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_default_editor", defaultEditor);
      set({ defaultEditor });
    },

    setCustomEditorCommand: (customEditorCommand: string) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_custom_editor_command", customEditorCommand);
      set({ customEditorCommand });
    },

    setDefaultTerminal: (defaultTerminal: ExternalTerminal) => {
      if (typeof localStorage !== "undefined")
        localStorage.setItem("gitvista_default_terminal", defaultTerminal);
      set({ defaultTerminal });
    },
  };
});
