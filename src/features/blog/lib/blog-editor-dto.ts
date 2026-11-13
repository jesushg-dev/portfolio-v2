import type {
  AppLanguage,
  BlogPost,
  BlogPostTranslation,
  BlogSeries,
} from "@prisma/client";

import {
  mergeTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import type { LanguageRef } from "@/lib/i18n/editor-rows";

export interface BlogPostTranslationFields {
  title: string;
  excerpt: string;
  content: string;
}

export interface BlogPostEditorDTO {
  id: string;
  slug: string;
  coverImage: string;
  tags: string[];
  seriesSlug: string;
  seriesName: string;
  seriesOrder: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  displayTitle: string;
  translations: TranslationMap<BlogPostTranslationFields>;
}

export interface BlogSeriesGroupDTO {
  key: string;
  slug: string;
  name: string;
  items: BlogPostEditorDTO[];
}

export interface BlogPostCreateFormDTO {
  slug: string;
  coverImage: string;
  tags: string[];
  seriesSlug?: string;
  seriesName: string;
  seriesOrder: number | null;
  status: "DRAFT";
  publishedAt: null;
  translations: TranslationMap<BlogPostTranslationFields>;
}

export type BlogPostWithTranslations = BlogPost & {
  translations: BlogPostTranslation[];
  series?:
    | (BlogSeries & {
        translations?: { title: string; appLanguageId?: string }[];
      })
    | null;
};

const EMPTY_FIELDS: BlogPostTranslationFields = {
  title: "",
  excerpt: "",
  content: "",
};

export function resolveSeriesTitle(
  series:
    | {
        slug: string;
        translations?: { title: string; appLanguageId?: string }[];
      }
    | null
    | undefined,
  languages: LanguageRef[],
  preferredLocale?: string,
): string {
  if (!series) return "";
  if (!series.translations || series.translations.length === 0) {
    return series.slug ?? "";
  }

  const preferredLangId = languages.find(
    (l) => l.code.toLowerCase() === preferredLocale?.toLowerCase(),
  )?.id;
  const enLangId = languages.find((l) => l.code.toLowerCase() === "en")?.id;
  const esLangId = languages.find((l) => l.code.toLowerCase() === "es")?.id;

  const transMap = new Map<string, string>();
  for (const tr of series.translations) {
    if (tr.appLanguageId && tr.title) {
      transMap.set(tr.appLanguageId, tr.title);
    }
  }

  return (
    (preferredLangId ? transMap.get(preferredLangId) : undefined) ??
    (enLangId ? transMap.get(enLangId) : undefined) ??
    (esLangId ? transMap.get(esLangId) : undefined) ??
    series.translations[0]?.title ??
    series.slug
  );
}

export function mapBlogPostToEditorDto(
  post: BlogPostWithTranslations,
  languages: LanguageRef[],
  preferredLocale?: string,
): BlogPostEditorDTO {
  const seriesTitle = resolveSeriesTitle(
    post.series,
    languages,
    preferredLocale,
  );

  const translations = mergeTranslationMap(
    languages,
    post.translations.map((t) => ({
      appLanguageId: t.appLanguageId,
      title: t.title,
      excerpt: t.excerpt ?? "",
      content: t.content,
    })),
    EMPTY_FIELDS,
  );

  const preferredLangId = languages.find(
    (l) => l.code.toLowerCase() === preferredLocale?.toLowerCase(),
  )?.id;
  const enLangId = languages.find((l) => l.code.toLowerCase() === "en")?.id;
  const esLangId = languages.find((l) => l.code.toLowerCase() === "es")?.id;

  const displayTitle =
    (preferredLangId ? translations[preferredLangId]?.title : undefined) ??
    (enLangId ? translations[enLangId]?.title : undefined) ??
    (esLangId ? translations[esLangId]?.title : undefined) ??
    Object.values(translations).find((t) => t.title)?.title ??
    post.slug;

  return {
    id: post.id,
    slug: post.slug,
    coverImage: post.coverImage ?? "",
    tags: post.tags,
    seriesSlug: post.series?.slug ?? "",
    seriesName: seriesTitle,
    seriesOrder: post.seriesOrder ?? null,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    displayTitle,
    translations,
  };
}

export function mapBlogPostsToEditorDto(
  posts: BlogPostWithTranslations[],
  languages: LanguageRef[],
  preferredLocale?: string,
): BlogPostEditorDTO[] {
  return posts.map((p) =>
    mapBlogPostToEditorDto(p, languages, preferredLocale),
  );
}

export function groupBlogPosts(posts: BlogPostEditorDTO[]): {
  series: BlogSeriesGroupDTO[];
  standalone: BlogPostEditorDTO[];
} {
  const seriesMap = new Map<string, BlogPostEditorDTO[]>();
  const standalone: BlogPostEditorDTO[] = [];

  for (const post of posts) {
    const sKey = post.seriesSlug?.trim() || post.seriesName?.trim();
    if (sKey) {
      const list = seriesMap.get(sKey) ?? [];
      list.push(post);
      seriesMap.set(sKey, list);
    } else {
      standalone.push(post);
    }
  }

  for (const list of seriesMap.values()) {
    list.sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
  }

  return {
    series: Array.from(seriesMap.entries()).map(([key, items]) => ({
      key,
      slug: items[0]?.seriesSlug || key,
      name: items[0]?.seriesName || items[0]?.seriesSlug || key,
      items,
    })),
    standalone,
  };
}

export function buildEmptyBlogPostCreateDto(
  languages: AppLanguage[],
  prefillSeries?: string,
): BlogPostCreateFormDTO {
  return {
    slug: "",
    coverImage: "",
    tags: [],
    seriesSlug: prefillSeries ?? "",
    seriesName: prefillSeries ?? "",
    seriesOrder: null,
    status: "DRAFT",
    publishedAt: null,
    translations: mergeTranslationMap(languages, undefined, EMPTY_FIELDS),
  };
}
