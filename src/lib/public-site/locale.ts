import "server-only";

import { locale } from "next/root-params";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";

export async function getPublicLocale() {
  const value = await locale();
  const activeLocale = locales.find((candidate) => candidate === value);
  if (!activeLocale) notFound();
  return activeLocale;
}
