import "server-only";

import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";
import { TRPCError } from "@trpc/server";
import { FaqItemsSchema, parseFaqItems } from "@/features/home/lib/faq-content";

type DbClient = typeof db;
type DbLike = Prisma.TransactionClient | DbClient;

const HeroTitleTranslationMapSchema = z.record(
  z.string(),
  z.object({
    text: z.string(),
  }),
);

const ProfileHeroUpsertSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().or(z.literal("")),
  heroSubtitleTranslations: HeroTitleTranslationMapSchema.optional().default(
    {},
  ),
  heroTaglineTranslations: HeroTitleTranslationMapSchema.optional().default({}),
  heroSummaryTranslations: HeroTitleTranslationMapSchema.optional().default({}),
  clientImageAltTranslations: HeroTitleTranslationMapSchema.optional().default(
    {},
  ),
  heroBadgeTranslations: HeroTitleTranslationMapSchema.optional().default({}),
  backgroundImageUrl: z.string().url().or(z.literal("")).optional(),
});

const ProfileAboutUpsertSchema = z.object({
  aboutMeTranslations: HeroTitleTranslationMapSchema.optional().default({}),
});

export async function getProfileHeroEditorDto(
  db: DbLike,
  userId: string,
): Promise<ProfileHeroEditorDTO> {
  const [languages, header] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.portfolioHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
  ]);

  const heroSubtitleTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.heroSubtitle ?? "" }];
    }),
  );

  const heroTaglineTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.heroTagline ?? "" }];
    }),
  );

  const heroSummaryTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.heroSummary ?? "" }];
    }),
  );

  const clientImageAltTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.clientImageAlt ?? "" }];
    }),
  );

  const heroBadgeTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.availabilityBadge ?? "" }];
    }),
  );

  return {
    fullName: header?.fullName ?? "",
    photoUrl: header?.photoUrl ?? "",
    heroSubtitleTranslations,
    heroTaglineTranslations,
    heroSummaryTranslations,
    clientImageAltTranslations,
    heroBadgeTranslations,
  };
}

export async function getProfileAboutEditorDto(
  db: DbLike,
  userId: string,
): Promise<{ aboutMeTranslations: Record<string, { text: string }> }> {
  const [languages, aboutMe] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.portfolioHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
  ]);

  const aboutMeTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = aboutMe?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.portfolioAbout ?? "" }];
    }),
  );

  return { aboutMeTranslations };
}

export async function upsertProfileAbout(
  db: DbClient,
  userId: string,
  input: z.infer<typeof ProfileAboutUpsertSchema>,
): Promise<{ aboutMeTranslations: Record<string, { text: string }> }> {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const about = await db.portfolioHeader.upsert({
    where: { userId },
    create: { userId, fullName: "" },
    update: {},
  });

  for (const lang of languages) {
    const aboutMeText = input.aboutMeTranslations?.[lang.id]?.text ?? "";
    await db.portfolioHeaderTranslation.upsert({
      where: {
        portfolioHeaderId_appLanguageId: {
          portfolioHeaderId: about.id,
          appLanguageId: lang.id,
        },
      },
      update: { portfolioAbout: aboutMeText },
      create: {
        portfolioHeaderId: about.id,
        appLanguageId: lang.id,
        portfolioAbout: aboutMeText,
      },
    });
  }

  return getProfileAboutEditorDto(db, userId);
}

export async function upsertProfileHeroFromMaps(
  db: DbClient,
  userId: string,
  input: z.infer<typeof ProfileHeroUpsertSchema>,
): Promise<ProfileHeroEditorDTO> {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const photoUrl = input.photoUrl ? input.photoUrl : null;
  const backgroundImageUrl = input.backgroundImageUrl ?? null;

  const header = await db.portfolioHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: input.fullName,
      photoUrl,
      backgroundImageUrl,
    },
    update: {
      fullName: input.fullName,
      photoUrl,
      backgroundImageUrl,
    },
  });

  for (const lang of languages) {
    const heroSubtitleText =
      input.heroSubtitleTranslations?.[lang.id]?.text ?? "";
    const heroTaglineText =
      input.heroTaglineTranslations?.[lang.id]?.text ?? "";
    const heroSummaryText =
      input.heroSummaryTranslations?.[lang.id]?.text ?? "";
    const clientImageAltText =
      input.clientImageAltTranslations?.[lang.id]?.text ?? "";
    const badgeText = input.heroBadgeTranslations?.[lang.id]?.text ?? "";
    const existingTrans = await db.portfolioHeaderTranslation.findFirst({
      where: { portfolioHeaderId: header.id, appLanguageId: lang.id },
    });

    if (existingTrans) {
      await db.portfolioHeaderTranslation.update({
        where: { id: existingTrans.id },
        data: {
          heroSubtitle: heroSubtitleText || null,
          heroTagline: heroTaglineText || null,
          heroSummary: heroSummaryText || null,
          availabilityBadge: badgeText || null,
          clientImageAlt: clientImageAltText || null,
        },
      });
    } else {
      await db.portfolioHeaderTranslation.create({
        data: {
          portfolioHeaderId: header.id,
          appLanguageId: lang.id,

          heroSubtitle: heroSubtitleText || null,
          heroTagline: heroTaglineText || null,
          heroSummary: heroSummaryText || null,
          availabilityBadge: badgeText || null,
          clientImageAlt: clientImageAltText || null,
        },
      });
    }
  }

  return getProfileHeroEditorDto(db, userId);
}

export const profileAdminRouter = createTRPCRouter({
  getContactPreferences: protectedProcedure.query(async ({ ctx }) => {
    const [languages, header] = await Promise.all([
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ctx.db.portfolioHeader.findUnique({
        where: { userId: ctx.user.id },
        include: { translations: true },
      }),
    ]);
    return languages.map((language) => ({
      id: language.id,
      name: language.name,
      responseTime:
        header?.translations.find((row) => row.appLanguageId === language.id)
          ?.contactResponseTime ?? "",
    }));
  }),

  upsertContactPreferences: protectedProcedure
    .input(
      z.object({
        translations: z.record(z.string(), z.string().trim().max(160)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      if (
        Object.keys(input.translations).some(
          (id) => !languages.some((language) => language.id === id),
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown language",
        });
      }
      const header = await ctx.db.portfolioHeader.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, fullName: "" },
        update: {},
      });
      for (const [appLanguageId, text] of Object.entries(input.translations)) {
        await ctx.db.portfolioHeaderTranslation.upsert({
          where: {
            portfolioHeaderId_appLanguageId: {
              portfolioHeaderId: header.id,
              appLanguageId,
            },
          },
          create: {
            portfolioHeaderId: header.id,
            appLanguageId,
            contactResponseTime: text || null,
          },
          update: { contactResponseTime: text || null },
        });
      }
      return { saved: true };
    }),

  getCareerAvailabilityEditor: protectedProcedure.query(async ({ ctx }) => {
    const [languages, header] = await Promise.all([
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ctx.db.portfolioHeader.findUnique({
        where: { userId: ctx.user.id },
        include: { translations: true },
      }),
    ]);
    return {
      availableForWork: header?.availableForWork ?? false,
      translations: languages.map((language) => {
        const row = header?.translations.find(
          (translation) => translation.appLanguageId === language.id,
        );
        return {
          id: language.id,
          name: language.name,
          code: language.code,
          title: row?.careerNextTitle ?? "",
          description: row?.careerNextDescription ?? "",
        };
      }),
    };
  }),

  upsertCareerAvailability: protectedProcedure
    .input(
      z.object({
        availableForWork: z.boolean(),
        translations: z.array(
          z.object({
            appLanguageId: z.string(),
            title: z.string().max(160),
            description: z.string().max(1000),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        select: { id: true },
      });
      if (
        input.translations.some(
          (translation) =>
            !languages.some(
              (language) => language.id === translation.appLanguageId,
            ),
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown language",
        });
      }
      await ctx.db.$transaction(async (tx) => {
        const header = await tx.portfolioHeader.upsert({
          where: { userId: ctx.user.id },
          create: {
            userId: ctx.user.id,
            fullName: "",
            availableForWork: input.availableForWork,
          },
          update: { availableForWork: input.availableForWork },
        });
        for (const translation of input.translations) {
          const data = {
            careerNextTitle: translation.title.trim() || null,
            careerNextDescription: translation.description.trim() || null,
          };
          await tx.portfolioHeaderTranslation.upsert({
            where: {
              portfolioHeaderId_appLanguageId: {
                portfolioHeaderId: header.id,
                appLanguageId: translation.appLanguageId,
              },
            },
            create: {
              portfolioHeaderId: header.id,
              appLanguageId: translation.appLanguageId,
              ...data,
            },
            update: data,
          });
        }
      });
      return { success: true };
    }),

  getFaqEditor: protectedProcedure.query(async ({ ctx }) => {
    const [languages, header] = await Promise.all([
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ctx.db.portfolioHeader.findUnique({
        where: { userId: ctx.user.id },
        include: { translations: true },
      }),
    ]);
    return languages.map((language) => ({
      id: language.id,
      name: language.name,
      code: language.code,
      items: parseFaqItems(
        header?.translations.find((row) => row.appLanguageId === language.id)
          ?.faqItems,
      ),
    }));
  }),

  upsertFaq: protectedProcedure
    .input(z.object({ appLanguageId: z.string(), items: FaqItemsSchema }))
    .mutation(async ({ ctx, input }) => {
      const language = await ctx.db.appLanguage.findUnique({
        where: { id: input.appLanguageId },
      });
      if (!language)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown language",
        });
      const header = await ctx.db.portfolioHeader.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, fullName: "" },
        update: {},
      });
      await ctx.db.portfolioHeaderTranslation.upsert({
        where: {
          portfolioHeaderId_appLanguageId: {
            portfolioHeaderId: header.id,
            appLanguageId: input.appLanguageId,
          },
        },
        create: {
          portfolioHeaderId: header.id,
          appLanguageId: input.appLanguageId,
          faqItems: input.items,
        },
        update: { faqItems: input.items },
      });
      return { saved: true };
    }),

  getHeroEditor: protectedProcedure.query(async ({ ctx }) => {
    return getProfileHeroEditorDto(ctx.db, ctx.user.id);
  }),

  upsertHero: protectedProcedure
    .input(ProfileHeroUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertProfileHeroFromMaps(ctx.db, ctx.user.id, input);
    }),

  getAboutEditor: protectedProcedure.query(async ({ ctx }) => {
    return getProfileAboutEditorDto(ctx.db, ctx.user.id);
  }),

  upsertAbout: protectedProcedure
    .input(ProfileAboutUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertProfileAbout(ctx.db, ctx.user.id, input);
    }),
});

// Re-export about helper used by public pages
export { splitAboutParagraphs } from "@/features/profile/lib/about-utils";
