import { useSettingsStore } from "../store/useSettingsStore";
import { vi, Translations } from "./vi";
import { en } from "./en";

const dictionaries: Record<"vi" | "en", Translations> = {
  vi,
  en,
};

export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale);
  const mode = useSettingsStore((s) => s.mode);

  const t = dictionaries[locale] || en;
  const actions = mode === "advanced" ? t.gitActions.advanced : t.gitActions.simple;

  return {
    t,
    actions,
    locale,
    mode,
  };
}

