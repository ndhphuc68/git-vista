import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type Locale = "vi" | "en";
export type AppMode = "simple" | "advanced";

interface SettingsState {
  theme: Theme;
  colorblind: boolean;
  locale: Locale;
  mode: AppMode;
  setTheme: (theme: Theme) => void;
  setColorblind: (enabled: boolean) => void;
  setLocale: (locale: Locale) => void;
  setMode: (mode: AppMode) => void;
  resolvedTheme: "light" | "dark";
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
  // Đọc thiết lập ban đầu từ localStorage nếu có
  const savedTheme = (typeof localStorage !== "undefined" && (localStorage.getItem("theme") as Theme)) || "system";
  const savedColorblind = typeof localStorage !== "undefined" && localStorage.getItem("colorblind") === "true";
  const savedLocale = (typeof localStorage !== "undefined" && (localStorage.getItem("locale") as Locale)) || "vi";
  const savedMode = (typeof localStorage !== "undefined" && (localStorage.getItem("mode") as AppMode)) || "simple";

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

    setTheme: (theme: Theme) => {
      const resolved = theme === "system" ? getSystemTheme() : theme;
      if (typeof localStorage !== "undefined") localStorage.setItem("theme", theme);
      applyThemeAttributes(resolved, get().colorblind);
      set({ theme, resolvedTheme: resolved });
    },

    setColorblind: (colorblind: boolean) => {
      if (typeof localStorage !== "undefined") localStorage.setItem("colorblind", String(colorblind));
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
  };
});

