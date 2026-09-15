import { useSettingsStore } from "../store/useSettingsStore";
import { vi, Translations } from "./vi";
import { en } from "./en";

const dictionaries: Record<"vi" | "en", Translations> = {
  vi,
  en,
};

export function getTranslation(locale?: "vi" | "en"): Translations {
  const currentLocale = locale || useSettingsStore.getState().locale || "vi";
  return dictionaries[currentLocale] || vi;
}

export function formatRelativeTime(
  timestampSec: number,
  timeDict: Translations["diff"]["time"]
): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSec;

  if (diff < 0 || diff < 60) return timeDict.justNow;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return timeDict.minutesAgo.replace("{m}", String(m));
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return timeDict.hoursAgo.replace("{h}", String(h));
  }
  if (diff < 86400 * 2) return timeDict.yesterday;
  if (diff < 86400 * 30) {
    const d = Math.floor(diff / 86400);
    return timeDict.daysAgo.replace("{d}", String(d));
  }
  if (diff < 86400 * 365) {
    const mo = Math.floor(diff / (86400 * 30));
    return timeDict.monthsAgo.replace("{mo}", String(mo));
  }
  const y = Math.floor(diff / (86400 * 365));
  return timeDict.yearsAgo.replace("{y}", String(y));
}

export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale);
  const mode = useSettingsStore((s) => s.mode);

  const t = dictionaries[locale] || vi;
  const actions = mode === "advanced" ? t.gitActions.advanced : t.gitActions.simple;

  return {
    t,
    actions,
    locale,
    mode,
  };
}


