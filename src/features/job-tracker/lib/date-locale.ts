import { enUS, es, nl } from "date-fns/locale";
import type { Locale } from "@/i18n/config";

const localeMap = {
  en: enUS,
  es,
  nl,
} as const;

export function getDateFnsLocale(locale: Locale) {
  return localeMap[locale] ?? enUS;
}
