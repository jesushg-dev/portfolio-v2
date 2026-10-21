import "server-only";

import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";

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

const PortfolioHeaderUpsertSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  heroSubtitle: HeroTitleTranslationMapSchema.nullable().optional(),
  heroTagline: HeroTitleTranslationMapSchema.nullable().optional(),
  heroSummary: HeroTitleTranslationMapSchema.nullable().optional(),
  clientImageAlt: HeroTitleTranslationMapSchema.nullable().optional(),
});

export async function getProfileHeroEditorDto(
  db: DbLike,
  userId: string,
): Promise<ProfileHeroEditorDTO> {
  const [languages, header] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
  ]);

  const heroSubtitleTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = header?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.heroSubtitle ?? trans?.degree ?? "" }];
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
    db.cvAboutMe.findUnique({
      where: { userId },
      include: { translations: true },
    }),
  ]);

  const aboutMeTranslations = Object.fromEntries(
    languages.map((l) => {
      const trans = aboutMe?.translations.find((t) => t.appLanguageId === l.id);
      return [l.id, { text: trans?.aboutMe ?? "" }];
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

  const about = await db.cvAboutMe.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  for (const lang of languages) {
    const aboutMeText = input.aboutMeTranslations?.[lang.id]?.text ?? "";
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

  const header = await db.cvHeader.upsert({
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
    const existingTrans = await db.cvHeaderTranslation.findFirst({
      where: { cvHeaderId: header.id, appLanguageId: lang.id },
    });

    if (existingTrans) {
      await db.cvHeaderTranslation.update({
        where: { id: existingTrans.id },
        data: {
          degree: heroSubtitleText || existingTrans.degree || "",
          heroSubtitle: heroSubtitleText || null,
          heroTagline: heroTaglineText || null,
          heroSummary: heroSummaryText || null,
          availabilityBadge: badgeText || null,
          clientImageAlt: clientImageAltText || null,
        },
      });
    } else {
      await db.cvHeaderTranslation.create({
        data: {
          cvHeaderId: header.id,
          appLanguageId: lang.id,
          degree: heroSubtitleText || "",
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
        const heroSubtitleText = input.heroSubtitle?.[lang.id]?.text;
        const heroTaglineText = input.heroTagline?.[lang.id]?.text;
        const heroSummaryText = input.heroSummary?.[lang.id]?.text;
        const clientImageAltText = input.clientImageAlt?.[lang.id]?.text;
        const existingTrans = await ctx.db.cvHeaderTranslation.findFirst({
          where: { cvHeaderId: header.id, appLanguageId: lang.id },
        });

        if (existingTrans) {
          await ctx.db.cvHeaderTranslation.update({
            where: { id: existingTrans.id },
            data: {
              ...(heroSubtitleText !== undefined
                ? {
                    heroSubtitle: heroSubtitleText || null,
                    degree: heroSubtitleText || existingTrans.degree || "",
                  }
                : {}),
              ...(heroTaglineText !== undefined
                ? { heroTagline: heroTaglineText || null }
                : {}),
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
              degree: heroSubtitleText ?? "",
              heroSubtitle: heroSubtitleText ?? null,
              heroTagline: heroTaglineText ?? null,
              heroSummary: heroSummaryText ?? null,
              clientImageAlt: clientImageAltText ?? null,
            },
          });
        }
      }

      return header;
    }),
});

// Re-export about helper used by public pages
export { splitAboutParagraphs } from "@/features/profile/lib/about-utils";
