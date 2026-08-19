import { setRequestLocale } from "next-intl/server";
import { type Locale as AppLocale, locales } from "@/i18n/config";

export { generateMetadata } from "./metadata";

import ThemeCustomizerView from "./theme-customizer-view";

interface ThemeCustomizerPageProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function ThemeCustomizerPage({
  params,
}: ThemeCustomizerPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;

  setRequestLocale(locale);

  return <ThemeCustomizerView />;
}
