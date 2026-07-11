import type { Prisma, PrismaClient } from "@prisma/client";

import { type Locale } from "@/i18n/config";

type DbLike = PrismaClient | Prisma.TransactionClient;

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
    translations: Record<
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

export async function fetchHeroTitlesForUser(client: DbLike, userId: string) {
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
      translations: Object.fromEntries(
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
  client: DbLike,
  userId: string,
): Promise<HeroTitleEditorDTO> {
  const titles = await fetchHeroTitlesForUser(client, userId);
  return mapHeroTitlesToEditorDto(titles);
}

export async function getHeroTitlesForLocale(
  client: DbLike,
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

export {
  isLocale,
  languageMapFromLocalized,
  localizedFromLanguageMap,
} from "@/lib/i18n/localized-json";

export function splitAboutParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
