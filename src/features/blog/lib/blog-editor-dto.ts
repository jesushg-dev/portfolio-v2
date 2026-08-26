import type { AppLanguage, BlogPost, BlogPostTranslation } from "@prisma/client";

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
  seriesName: string;
  seriesOrder: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  translations: TranslationMap<BlogPostTranslationFields>;
}

export interface BlogPostCreateFormDTO {
  slug: string;
  coverImage: string;
  tags: string[];
  seriesName: string;
  seriesOrder: number | null;
  status: "DRAFT";
  publishedAt: null;
  translations: TranslationMap<BlogPostTranslationFields>;
}

type BlogPostWithTranslations = BlogPost & {
  translations: BlogPostTranslation[];
};

const EMPTY_FIELDS: BlogPostTranslationFields = {
  title: "",
  excerpt: "",
  content: "",
};

export function mapBlogPostToEditorDto(
  post: BlogPostWithTranslations,
  languages: LanguageRef[],
): BlogPostEditorDTO {
  return {
    id: post.id,
    slug: post.slug,
    coverImage: post.coverImage ?? "",
    tags: post.tags,
    seriesName: post.seriesName ?? "",
    seriesOrder: post.seriesOrder ?? null,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    translations: mergeTranslationMap(
      languages,
      post.translations.map((t) => ({
        appLanguageId: t.appLanguageId,
        title: t.title,
        excerpt: t.excerpt ?? "",
        content: t.content,
      })),
      EMPTY_FIELDS,
    ),
  };
}

export function mapBlogPostsToEditorDto(
  posts: BlogPostWithTranslations[],
  languages: LanguageRef[],
): BlogPostEditorDTO[] {
  return posts.map((p) => mapBlogPostToEditorDto(p, languages));
}

export function buildEmptyBlogPostCreateDto(
  languages: AppLanguage[],
): BlogPostCreateFormDTO {
  return {
    slug: "",
    coverImage: "",
    tags: [],
    seriesName: "",
    seriesOrder: null,
    status: "DRAFT",
    publishedAt: null,
    translations: mergeTranslationMap(languages, undefined, EMPTY_FIELDS),
  };
}
