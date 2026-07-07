import { formatDistanceToNow } from "date-fns";
import { enUS, es, nl } from "date-fns/locale";

const localeMap = {
  en: enUS,
  es,
  nl,
} as const;

export function formatPlayedAt(playedAt: string, locale: string): string {
  const dateFnsLocale =
    locale in localeMap
      ? localeMap[locale as keyof typeof localeMap]
      : enUS;

  return formatDistanceToNow(new Date(playedAt), {
    addSuffix: true,
    locale: dateFnsLocale,
  });
}
