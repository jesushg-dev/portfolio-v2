import type { AbstractIntlMessages } from "next-intl";

import type { Locale } from "./locale";

export type { Locale };
export type Messages = AbstractIntlMessages;

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("../messages/en.json"),
  es: () => import("../messages/es.json"),
  nl: () => import("../messages/nl.json"),
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  const importedModule = await loaders[locale]();
  return importedModule.default;
}
