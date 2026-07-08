import type { PrismaClient } from "@prisma/client";

import { type Locale, locales } from "@/i18n/config";
import { getLocalizedText } from "@/lib/i18n/localized";

import type { HeroTitlesUpsertSchema } from "./schemas";
import type { z } from "zod";

type DbClient = PrismaClient;

const heroTitleInclude = {
  translations: {
    include: {
      language: true,
    },
  },
} as const;

export type HeroTitleEditorDTO = {
  titles: {
    order: number;
    translationsByLangId: Record<
      string,
      {
        text: string;
      }
    >;
  }[];
};

export type HeroTitleResolved = {
  order: number;
  translations: {
    languageCode: string;
    text: string;
  }[];
};

export async function fetchHeroTitlesForUser(client: DbClient, userId: string) {
  return client.cvHeroTitle.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: heroTitleInclude,
  });
}

export function mapHeroTitlesToEditorDto(
  titles: Awaited<ReturnType<typeof fetchHeroTitlesForUser>>,
): HeroTitleEditorDTO {
  return {
    titles: titles.map((title) => ({
      order: title.order,
      translationsByLangId: Object.fromEntries(
        title.translations.map((translation) => [
          translation.appLanguageId,
          { text: translation.text },
        ]),
      ),
    })),
  };
}

export function mapHeroTitlesToResolved(
  titles: Awaited<ReturnType<typeof fetchHeroTitlesForUser>>,
): HeroTitleResolved[] {
  return titles.map((title) => ({
    order: title.order,
    translations: title.translations.map((translation) => ({
      languageCode: translation.language.code,
      text: translation.text,
    })),
  }));
}

function pickTitleTranslation(
  translations: HeroTitleResolved["translations"],
  locale: Locale,
  defaultLocale?: Locale,
) {
  const byLocale = translations.find((t) => t.languageCode === locale);
  if (byLocale?.text.trim()) return byLocale.text;

  if (defaultLocale && defaultLocale !== locale) {
    const byDefault = translations.find(
      (t) => t.languageCode === defaultLocale,
    );
    if (byDefault?.text.trim()) return byDefault.text;
  }

  const firstNonEmpty = translations.find((t) => t.text.trim());
  return firstNonEmpty?.text ?? "";
}

export function resolveHeroTitlesForLocale(
  titles: HeroTitleResolved[],
  locale: Locale,
  defaultLocale?: Locale,
): string[] {
  return [...titles]
    .sort((a, b) => a.order - b.order)
    .map((title) =>
      pickTitleTranslation(title.translations, locale, defaultLocale),
    )
    .filter((text) => text.trim() !== "");
}

export async function getHeroTitlesEditorDto(
  client: DbClient,
  userId: string,
): Promise<HeroTitleEditorDTO> {
  const titles = await fetchHeroTitlesForUser(client, userId);
  return mapHeroTitlesToEditorDto(titles);
}

export async function getHeroTitlesForLocale(
  client: DbClient,
  userId: string,
  locale: Locale,
  defaultLocale?: Locale,
): Promise<string[]> {
  const titles = await fetchHeroTitlesForUser(client, userId);
  return resolveHeroTitlesForLocale(
    mapHeroTitlesToResolved(titles),
    locale,
    defaultLocale,
  );
}

export async function upsertHeroTitlesFromEditor(
  client: DbClient,
  userId: string,
  input: z.infer<typeof HeroTitlesUpsertSchema>,
): Promise<HeroTitleEditorDTO> {
  await client.$transaction(async (tx) => {
    await tx.cvHeroTitle.deleteMany({ where: { userId } });

    for (const title of [...input.titles].sort((a, b) => a.order - b.order)) {
      await tx.cvHeroTitle.create({
        data: {
          userId,
          order: title.order,
          translations: {
            create: title.translations.map((translation) => ({
              appLanguageId: translation.appLanguageId,
              text: translation.text,
            })),
          },
        },
      });
    }
  });

  return getHeroTitlesEditorDto(client, userId);
}

export function splitAboutParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localizedFromLanguageMap(
  valuesByCode: Record<string, string>,
  primaryCode: string,
): { default: string; translations?: Record<string, string> } {
  const defaultText = valuesByCode[primaryCode]?.trim() ?? "";
  const translations = Object.fromEntries(
    Object.entries(valuesByCode).filter(
      ([code, value]) => code !== primaryCode && value.trim() !== "",
    ),
  );

  return {
    default: defaultText,
    ...(Object.keys(translations).length > 0 ? { translations } : {}),
  };
}

export function languageMapFromLocalized(
  value: unknown,
  languageCodes: string[],
): Record<string, string> {
  return Object.fromEntries(
    languageCodes.map((code) => [
      code,
      getLocalizedText(value, isLocale(code) ? code : "en"),
    ]),
  );
}
