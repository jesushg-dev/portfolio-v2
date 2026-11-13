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
  seriesSlug?: string | null;
  seriesName?: string | null;
  seriesOrder?: number | null;
  title: string;
  excerpt: string;
  tags?: string[];
  coverImage?: string | null;
  content: Record<string, unknown>;
}

const asoSeriesSeed = {
  slug: "operating-systems-architecture",
  coverImage: "/images/blog/aso/image37.png",
  title: {
    es: "Arquitectura de Sistemas Operativos: Kernel, Personalización y Servicios",
    en: "Operating Systems Architecture: Kernel, Customization, and Services",
    nl: "Besturingssysteemarchitectuur: Kernel, Aanpassing en Services",
  },
  description: {
    es: "Guía práctica y académica de administración de sistemas Linux: compilación de kernel, bootloaders, VoIP, FTP y hardening de SSH.",
    en: "Hands-on and academic guide to Linux systems administration: kernel compilation, bootloaders, VoIP, FTP, and SSH hardening.",
    nl: "Praktische en academische gids voor Linux-systeembeheer: kernelcompilatie, bootloaders, VoIP, FTP en SSH-beveiliging.",
  },
};

function syncSeriesTag(tags: string[], seriesSlug: string | null | undefined) {
  const cleaned = tags.filter(
    (tag) => !tag.toLowerCase().startsWith("series:"),
  );
  if (!seriesSlug) return cleaned;
  return [...cleaned, `series:${seriesSlug}`];
}

export async function seedPortfolioBlog(
  prisma: PrismaClient,
  langIds: Record<LocaleCode, string>,
  userId: string,
): Promise<void> {
  console.log(
    "[seed-portfolio-blog] seeding blog posts and normalized series...",
  );

  await prisma.blogPostTranslation.deleteMany({
    where: { post: { userId } },
  });
  await prisma.blogPost.deleteMany({ where: { userId } });
  await prisma.blogSeriesTranslation.deleteMany({
    where: { series: { userId } },
  });
  await prisma.blogSeries.deleteMany({ where: { userId } });

  // 1. Seed BlogSeries entities
  const portfolioSeries = await prisma.blogSeries.create({
    data: {
      userId,
      slug: portfolioBlog.series.slug,
      coverImage: portfolioBlog.series.coverImage ?? null,
      translations: {
        create: (["es", "en", "nl"] as const).map((locale) => ({
          appLanguageId: langIds[locale],
          title: portfolioBlog.series.title[locale],
          description: portfolioBlog.series.description[locale],
        })),
      },
    },
  });

  const asoSeries = await prisma.blogSeries.create({
    data: {
      userId,
      slug: asoSeriesSeed.slug,
      coverImage: asoSeriesSeed.coverImage,
      translations: {
        create: (["es", "en", "nl"] as const).map((locale) => ({
          appLanguageId: langIds[locale],
          title: asoSeriesSeed.title[locale],
          description: asoSeriesSeed.description[locale],
        })),
      },
    },
  });

  // 2. Seed portfolio series posts
  for (const post of portfolioBlog.posts) {
    const tags = syncSeriesTag(post.tags, portfolioSeries.slug);

    await prisma.blogPost.create({
      data: {
        userId,
        slug: post.slug,
        coverImage: post.coverImage,
        tags,
        seriesId: portfolioSeries.id,
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

  // 3. Seed drafts from blog-drafts directory as published posts
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const draftsDir = path.resolve(dirname, "./data/blog-drafts");
  const draftFiles = readdirSync(draftsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const draftsBySlug = new Map<string, Map<LocaleCode, DraftJson>>();
  for (const file of draftFiles) {
    const fullPath = path.join(draftsDir, file);
    const draft = JSON.parse(readFileSync(fullPath, "utf8")) as DraftJson;
    if (!draftsBySlug.has(draft.slug)) {
      draftsBySlug.set(draft.slug, new Map());
    }
    draftsBySlug.get(draft.slug)!.set(draft.locale, draft);
  }

  for (const [slug, localeMap] of draftsBySlug) {
    const fallbackDraft =
      localeMap.get("es") ??
      localeMap.get("en") ??
      localeMap.values().next().value!;

    const isAso = slug.startsWith("aso-");
    const targetSeries = isAso ? asoSeries : null;
    const seriesOrder = isAso ? (fallbackDraft.seriesOrder ?? null) : null;
    const tags = syncSeriesTag(fallbackDraft.tags ?? [], targetSeries?.slug);
    const publishedAt = fallbackDraft.publishedAt
      ? new Date(fallbackDraft.publishedAt)
      : new Date("2024-11-01T00:00:00.000Z");

    await prisma.blogPost.create({
      data: {
        userId,
        slug,
        coverImage: fallbackDraft.coverImage ?? null,
        tags,
        seriesId: targetSeries?.id ?? null,
        seriesOrder,
        status: "PUBLISHED",
        publishedAt,
        createdAt: fallbackDraft.createdAt
          ? new Date(fallbackDraft.createdAt)
          : publishedAt,
        translations: {
          create: (["es", "en", "nl"] as const).map((locale) => {
            const localized = localeMap.get(locale) ?? fallbackDraft;
            return {
              appLanguageId: langIds[locale],
              title: localized.title,
              excerpt: localized.excerpt,
              content: JSON.stringify(localized.content),
            };
          }),
        },
      },
    });
  }

  const total = portfolioBlog.posts.length + draftsBySlug.size;
  console.log(
    `[seed-portfolio-blog] done. seeded 2 series and ${total} posts.`,
  );
}

export { portfolioBlog };
