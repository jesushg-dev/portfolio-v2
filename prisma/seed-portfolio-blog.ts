import type { PrismaClient } from "@prisma/client";

import {
  explodePostBlocks,
  portfolioBlog,
  type LocaleCode,
} from "./data/portfolio-blog";
import { serializeTiptapDocument } from "./lib/tiptap-content-seed";

function syncSeriesTag(tags: string[], seriesName: string) {
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
  const data = portfolioBlog;
  console.log("[seed-portfolio-blog] seeding blog posts...");

  await prisma.blogPostTranslation.deleteMany({
    where: { post: { userId } },
  });
  await prisma.blogPost.deleteMany({ where: { userId } });

  for (const post of data.posts) {
    const tags = syncSeriesTag(post.tags, data.seriesName);

    await prisma.blogPost.create({
      data: {
        userId,
        slug: post.slug,
        coverImage: post.coverImage,
        tags,
        seriesName: data.seriesName,
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

  console.log(
    `[seed-portfolio-blog] done. series="${data.seriesName}" posts=${data.posts.length}`,
  );
}

export { portfolioBlog };
