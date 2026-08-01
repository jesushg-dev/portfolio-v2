import "server-only";

import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
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
    db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.cvAboutMe.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    getHeroTitlesEditorDto(db, userId),
  ]);

  const emptyTextMap = buildEmptyTranslationMap(languages, { text: "" });

  const heroSummaryTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.heroSummary ?? "" }];
    }),
  );

  const aboutMeTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = aboutMe?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.aboutMe ?? "" }];
    }),
  );

  return {
    fullName: header?.fullName ?? "",
    photoUrl: header?.photoUrl ?? "",
    backgroundImageUrl: header?.backgroundImageUrl ?? "",
    heroSummaryTranslations,
    aboutMeTranslations,
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

  const header = await db.cvHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: input.fullName,
      photoUrl: input.photoUrl || null,
      backgroundImageUrl: input.backgroundImageUrl || null,
    },
    update: {
      fullName: input.fullName,
      photoUrl: input.photoUrl || null,
      backgroundImageUrl: input.backgroundImageUrl || null,
    },
  });

  for (const lang of languages) {
    const heroSummaryText = input.heroSummaryTranslations[lang.id]?.text ?? "";
    const existingTrans = await db.cvHeaderTranslation.findFirst({
      where: { cvHeaderId: header.id, appLanguageId: lang.id },
    });

    if (existingTrans) {
      await db.cvHeaderTranslation.update({
        where: { id: existingTrans.id },
        data: { heroSummary: heroSummaryText || null },
      });
    } else {
      await db.cvHeaderTranslation.create({
        data: {
          cvHeaderId: header.id,
          appLanguageId: lang.id,
          degree: "",
          heroSummary: heroSummaryText || null,
        },
      });
    }
  }

  const about = await db.cvAboutMe.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  for (const lang of languages) {
    const aboutMeText = input.aboutMeTranslations[lang.id]?.text ?? "";
    const existingAboutTrans = await db.cvAboutMeTranslation.findFirst({
      where: { cvAboutMeId: about.id, appLanguageId: lang.id },
    });

    if (existingAboutTrans) {
      await db.cvAboutMeTranslation.update({
        where: { id: existingAboutTrans.id },
        data: { aboutMe: aboutMeText },
      });
    } else {
      await db.cvAboutMeTranslation.create({
        data: {
          cvAboutMeId: about.id,
          appLanguageId: lang.id,
          aboutMe: aboutMeText,
        },
      });
    }
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
  getHeroEditor: protectedProcedure.query(async ({ ctx }) => {
    return getProfileHeroEditorDto(ctx.db, ctx.user.id);
  }),

  upsertHero: protectedProcedure
    .input(ProfileHeroUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertProfileHeroFromMaps(ctx.db, ctx.user.id, input);
    }),

  upsertHeroTitlesOnly: protectedProcedure
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

      const header = await ctx.db.cvHeader.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          fullName: input.fullName,
          photoUrl: input.photoUrl ?? null,
          backgroundImageUrl: input.backgroundImageUrl ?? null,
        },
        update: {
          fullName: input.fullName,
          photoUrl: input.photoUrl ?? null,
          backgroundImageUrl: input.backgroundImageUrl ?? null,
        },
      });

      for (const lang of languages) {
        const heroSummaryText = input.heroSummary?.[lang.id]?.text;
        const clientImageAltText = input.clientImageAlt?.[lang.id]?.text;
        const existingTrans = await ctx.db.cvHeaderTranslation.findFirst({
          where: { cvHeaderId: header.id, appLanguageId: lang.id },
        });

        if (existingTrans) {
          await ctx.db.cvHeaderTranslation.update({
            where: { id: existingTrans.id },
            data: {
              ...(heroSummaryText !== undefined
                ? { heroSummary: heroSummaryText || null }
                : {}),
              ...(clientImageAltText !== undefined
                ? { clientImageAlt: clientImageAltText || null }
                : {}),
            },
          });
        } else {
          await ctx.db.cvHeaderTranslation.create({
            data: {
              cvHeaderId: header.id,
              appLanguageId: lang.id,
              degree: "",
              heroSummary: heroSummaryText ?? null,
              clientImageAlt: clientImageAltText ?? null,
            },
          });
        }
      }

      return header;
    }),
});

// Re-export hero title helpers used by public pages
export {
  fetchHeroTitlesForUser,
  getHeroTitlesForLocale,
  mapHeroTitlesToResolved,
  resolveHeroTitlesForLocale,
  splitAboutParagraphs,
} from "@/features/profile/server/hero-titles";
