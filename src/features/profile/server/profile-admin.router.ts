import "server-only";

import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import {
  languageMapToTextMap,
  optionalTextMapToLocalizedJson,
  textMapToLocalizedJson,
} from "@/lib/i18n/localized-text-map";
import {
  buildEmptyTranslationMap,
  translationMapEntries,
} from "@/lib/i18n/translation-map";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";
import { getHeroTitlesEditorDto } from "@/features/profile/server/hero-titles";

type DbClient = typeof db;
type DbLike = Prisma.TransactionClient | DbClient;

const HeroTitleTranslationMapSchema = z.record(
  z.string(),
  z.object({
    text: z.string(),
  }),
);

const HeroTitlesUpsertSchema = z.object({
  titles: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      translations: HeroTitleTranslationMapSchema,
    }),
  ),
});

const ProfileHeroUpsertSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().or(z.literal("")),
  backgroundImageUrl: z.string().url().or(z.literal("")),
  heroSummaryTranslations: HeroTitleTranslationMapSchema,
  aboutMeTranslations: HeroTitleTranslationMapSchema,
  titles: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      translations: HeroTitleTranslationMapSchema,
    }),
  ),
});

const PortfolioHeaderUpsertSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  heroSummary: HeroTitleTranslationMapSchema.nullable().optional(),
  clientImageAlt: HeroTitleTranslationMapSchema.nullable().optional(),
});

export async function getProfileHeroEditorDto(
  db: DbLike,
  userId: string,
): Promise<ProfileHeroEditorDTO> {
  const [languages, header, aboutMe, heroTitles] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.cvHeader.findUnique({ where: { userId } }),
    db.cvAboutMe.findUnique({ where: { userId } }),
    getHeroTitlesEditorDto(db, userId),
  ]);

  const emptyTextMap = buildEmptyTranslationMap(languages, { text: "" });

  return {
    fullName: header?.fullName ?? "",
    photoUrl: header?.photoUrl ?? "",
    backgroundImageUrl: header?.backgroundImageUrl ?? "",
    heroSummaryTranslations: header?.heroSummary
      ? languageMapToTextMap(header.heroSummary, languages)
      : emptyTextMap,
    aboutMeTranslations: aboutMe?.aboutMe
      ? languageMapToTextMap(aboutMe.aboutMe, languages)
      : emptyTextMap,
    titles:
      heroTitles.titles.length > 0
        ? heroTitles.titles
        : [
            {
              order: 0,
              translations: emptyTextMap,
            },
          ],
  };
}

export async function upsertProfileHeroFromMaps(
  db: DbClient,
  userId: string,
  input: z.infer<typeof ProfileHeroUpsertSchema>,
): Promise<ProfileHeroEditorDTO> {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const existingHeader = await db.cvHeader.findUnique({
    where: { userId },
  });
  const degreeValue = (existingHeader?.degree ?? {
    default: "",
  }) as Prisma.InputJsonValue;

  const heroSummary = textMapToLocalizedJson(
    input.heroSummaryTranslations,
    languages,
  );
  const aboutMePayload = textMapToLocalizedJson(
    input.aboutMeTranslations,
    languages,
  );

  await db.cvHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: input.fullName,
      degree: degreeValue,
      photoUrl: input.photoUrl || null,
      backgroundImageUrl: input.backgroundImageUrl || null,
      heroSummary: (heroSummary ?? undefined) as
        Prisma.InputJsonValue | undefined,
      clientImageAlt: existingHeader?.clientImageAlt ?? undefined,
    },
    update: {
      fullName: input.fullName,
      photoUrl: input.photoUrl || null,
      backgroundImageUrl: input.backgroundImageUrl || null,
      heroSummary: (heroSummary ?? undefined) as
        Prisma.InputJsonValue | undefined,
    },
  });

  if (aboutMePayload?.default) {
    await db.cvAboutMe.upsert({
      where: { userId },
      create: {
        userId,
        aboutMe: aboutMePayload as Prisma.InputJsonValue,
      },
      update: { aboutMe: aboutMePayload as Prisma.InputJsonValue },
    });
  }

  await db.$transaction(async (tx) => {
    await tx.cvHeroTitle.deleteMany({ where: { userId } });

    for (const title of [...input.titles].sort((a, b) => a.order - b.order)) {
      const translations = translationMapEntries(title.translations).filter(
        (entry) => entry.text.trim() !== "",
      );

      if (translations.length === 0) continue;

      await tx.cvHeroTitle.create({
        data: {
          userId,
          order: title.order,
          translations: {
            create: translations.map((translation) => ({
              appLanguageId: translation.appLanguageId,
              text: translation.text,
            })),
          },
        },
      });
    }
  });

  return getProfileHeroEditorDto(db, userId);
}

export const profileAdminRouter = createTRPCRouter({
  getHeroMine: protectedProcedure.query(async ({ ctx }) => {
    return getProfileHeroEditorDto(ctx.db, ctx.user.id);
  }),

  getHeroTitlesMine: protectedProcedure.query(async ({ ctx }) => {
    return getHeroTitlesEditorDto(ctx.db, ctx.user.id);
  }),

  upsertHero: protectedProcedure
    .input(ProfileHeroUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertProfileHeroFromMaps(ctx.db, ctx.user.id, input);
    }),

  upsertHeroTitles: protectedProcedure
    .input(HeroTitlesUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        await tx.cvHeroTitle.deleteMany({ where: { userId: ctx.user.id } });

        for (const title of [...input.titles].sort(
          (a, b) => a.order - b.order,
        )) {
          const translations = translationMapEntries(title.translations).filter(
            (entry) => entry.text.trim() !== "",
          );

          if (translations.length === 0) continue;

          await tx.cvHeroTitle.create({
            data: {
              userId: ctx.user.id,
              order: title.order,
              translations: {
                create: translations.map((translation) => ({
                  appLanguageId: translation.appLanguageId,
                  text: translation.text,
                })),
              },
            },
          });
        }
      });

      return getHeroTitlesEditorDto(ctx.db, ctx.user.id);
    }),

  upsertPortfolioHeader: protectedProcedure
    .input(PortfolioHeaderUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const existing = await ctx.db.cvHeader.findUnique({
        where: { userId: ctx.user.id },
      });

      const degreeValue = (existing?.degree ?? {
        default: "",
      }) as Prisma.InputJsonValue;

      const heroSummary =
        input.heroSummary === null
          ? null
          : optionalTextMapToLocalizedJson(
              input.heroSummary ?? undefined,
              languages,
            );
      const clientImageAlt =
        input.clientImageAlt === null
          ? null
          : optionalTextMapToLocalizedJson(
              input.clientImageAlt ?? undefined,
              languages,
            );

      return ctx.db.cvHeader.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          fullName: input.fullName,
          degree: degreeValue,
          photoUrl: input.photoUrl ?? null,
          backgroundImageUrl: input.backgroundImageUrl ?? null,
          heroSummary: (heroSummary ?? undefined) as
            Prisma.InputJsonValue | undefined,
          clientImageAlt: (clientImageAlt ?? undefined) as
            Prisma.InputJsonValue | undefined,
        },
        update: {
          fullName: input.fullName,
          photoUrl: input.photoUrl ?? null,
          backgroundImageUrl: input.backgroundImageUrl ?? null,
          ...(input.heroSummary !== undefined
            ? {
                heroSummary: (heroSummary ?? undefined) as
                  Prisma.InputJsonValue | undefined,
              }
            : {}),
          ...(input.clientImageAlt !== undefined
            ? {
                clientImageAlt: (clientImageAlt ?? undefined) as
                  Prisma.InputJsonValue | undefined,
              }
            : {}),
        },
      });
    }),
});

// Re-export hero title helpers used by public pages
export {
  fetchHeroTitlesForUser,
  getHeroTitlesForLocale,
  mapHeroTitlesToResolved,
  resolveHeroTitlesForLocale,
  splitAboutParagraphs,
  localizedFromLanguageMap,
  languageMapFromLocalized,
} from "@/features/profile/server/hero-titles";
