import { useSettingsStore, type DateFormat, type Locale } from "../store/useSettingsStore";
import { vi, type Translations } from "./vi";
import { en } from "./en";

const dictionaries: Record<"vi" | "en", Translations> = {
  vi,
  en,
};

export function getTranslation(locale?: "vi" | "en"): Translations {
  const currentLocale = locale || useSettingsStore.getState().locale || "en";
  return dictionaries[currentLocale] || en;
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

/** Locale-aware date and time, e.g. "Nov 14, 2023, 10:13 PM". */
export function formatAbsoluteDate(timestampSec: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(timestampSec * 1000)
  );
}

/** Formats a timestamp the way the user chose in Settings › Appearance › Date format. */
export function formatCommitDate(
  timestampSec: number,
  timeDict: Translations["diff"]["time"],
  locale: Locale,
  dateFormat: DateFormat
): string {
  return dateFormat === "absolute"
    ? formatAbsoluteDate(timestampSec, locale)
    : formatRelativeTime(timestampSec, timeDict);
}

/** Returns a formatter bound to the current locale and date format setting. */
export function useFormatDate(): (timestampSec: number) => string {
  const locale = useSettingsStore((s) => s.locale);
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const timeDict = (dictionaries[locale] || vi).diff.time;
  return (timestampSec: number) => formatCommitDate(timestampSec, timeDict, locale, dateFormat);
}

export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale);

  const t = dictionaries[locale] || vi;
  const actions = t.gitActions.advanced;

  return {
    t,
    actions,
    locale,
  };
}
