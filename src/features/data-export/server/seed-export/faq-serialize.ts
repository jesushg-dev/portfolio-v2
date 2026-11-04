import type { LanguageRef } from "@/lib/i18n/editor-rows";
import { parseFaqItems } from "@/features/home/lib/faq-content";
import { translationArray } from "./locales";

export function serializeFaq(
  header: {
    translations: { appLanguageId: string; faqItems?: unknown }[];
  } | null,
  languages: LanguageRef[],
) {
  return {
    translations: translationArray(
      header?.translations ?? [],
      languages,
      (row, locale) => ({
        locale,
        items: parseFaqItems(row.faqItems),
      }),
    ),
  };
}
