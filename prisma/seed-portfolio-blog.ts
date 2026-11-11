import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";

import {
  explodePostBlocks,
  portfolioBlog,
  type LocaleCode,
} from "./data/portfolio-blog";
import { serializeTiptapDocument } from "./lib/tiptap-content-seed";

interface DraftJson {
  slug: string;
  locale: LocaleCode;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  createdAt?: string;
  seriesName?: string | null;
  seriesOrder?: number | null;
  title: string;
  excerpt: string;
  tags?: string[];
  coverImage?: string | null;
  content: Record<string, unknown>;
}

function syncSeriesTag(tags: string[], seriesName: string | null | undefined) {
  const cleaned = tags.filter(
    (tag) => !tag.toLowerCase().startsWith("series:"),
  );
  if (!seriesName) return cleaned;
  return [...cleaned, `series:${seriesName}`];
}

export async function seedPortfolioBlog(
  prisma: PrismaClient,
  langIds: Record<LocaleCode, string>,
  userId: string,
): Promise<void> {
  console.log("[seed-portfolio-blog] seeding blog posts...");

  await prisma.blogPostTranslation.deleteMany({
    where: { post: { userId } },
  });
  await prisma.blogPost.deleteMany({ where: { userId } });

  // 1. Seed portfolio series posts
  for (const post of portfolioBlog.posts) {
    const tags = syncSeriesTag(post.tags, portfolioBlog.seriesName);

    await prisma.blogPost.create({
      data: {
        userId,
        slug: post.slug,
        coverImage: post.coverImage,
        tags,
        seriesName: portfolioBlog.seriesName,
        seriesOrder: post.seriesOrder,
        status: "PUBLISHED",
        publishedAt: new Date(post.publishedAt),
        translations: {
          create: (["es", "en", "nl"] as const).map((locale) => ({
            appLanguageId: langIds[locale],
            title: post.title[locale],
            excerpt: post.excerpt[locale],
            content: serializeTiptapDocument(explodePostBlocks(post, locale)),
          })),
        },
      },
    });
  }

  // 2. Seed drafts from blog-drafts directory as published posts
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const draftsDir = path.resolve(dirname, "./data/blog-drafts");
  const draftFiles = readdirSync(draftsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  for (const file of draftFiles) {
    const fullPath = path.join(draftsDir, file);
    const draft = JSON.parse(readFileSync(fullPath, "utf8")) as DraftJson;
    const tags = syncSeriesTag(draft.tags ?? [], draft.seriesName);
    const publishedAt = draft.publishedAt
      ? new Date(draft.publishedAt)
      : new Date("2024-11-01T00:00:00.000Z");

    const contentString = JSON.stringify(draft.content);

    await prisma.blogPost.create({
      data: {
        userId,
        slug: draft.slug,
        coverImage: draft.coverImage ?? null,
        tags,
        seriesName: draft.seriesName ?? null,
        seriesOrder: draft.seriesOrder ?? null,
        status: "PUBLISHED",
        publishedAt,
        createdAt: draft.createdAt ? new Date(draft.createdAt) : publishedAt,
        translations: {
          create: (["es", "en", "nl"] as const).map((locale) => ({
            appLanguageId: langIds[locale],
            title: draft.title,
            excerpt: draft.excerpt,
            content: contentString,
          })),
        },
      },
    });
  }

  const total = portfolioBlog.posts.length + draftFiles.length;
  console.log(`[seed-portfolio-blog] done. seeded ${total} published posts.`);
}

export { portfolioBlog };
