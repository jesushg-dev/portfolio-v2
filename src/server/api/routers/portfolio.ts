import { z } from "zod";

import { getLocalizedText } from "@/lib/i18n/localized";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { splitAboutParagraphs } from "@/features/profile/server/hero-titles";
import { mapTimelineItemsToPublic } from "@/features/timeline/lib/map-timeline-public";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  looksLikeSkillObjectId,
  skillSlugFromTitle,
} from "@/utils/tools/skill-slug";
import { formatExperienceDates } from "@/utils/tools/date";

const LanguageCode = z.enum(["es", "en", "nl"]);
const StackType = z.enum([
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
]);

/** Merge translation fields onto an entity without overwriting its primary `id`. */
function mergeTranslation<
  T extends { id: string },
  U extends { id?: string } | undefined,
>(entity: T, translation: U): T & Omit<NonNullable<U>, "id"> {
  if (!translation) {
    return entity as T & Omit<NonNullable<U>, "id">;
  }
  const translationFields = { ...translation };
  delete translationFields.id;
  return { ...entity, ...translationFields };
}

export const portfolioRouter = createTRPCRouter({
  getCertificates: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: z.array(StackType).optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, type, locale } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      // get certifications with translations (scoped to tenant when present)
      const baseWhere = {
        ...(type ? { type: { hasSome: type } } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      const data = await ctx.db.certification.findMany({
        include: {
          CertificationTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: baseWhere,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // first CertificationTranslation data should be at the same level as Certification object
      const dataWithTranslation = data.map((certification) => {
        const { CertificationTranslation, ...rest } = certification;

        return mergeTranslation(rest, CertificationTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more certificates to fetch (also tenant-scoped)
      const hasMore = await ctx.db.certification.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        cursor: lastCursor ? { id: lastCursor } : undefined,
        where: baseWhere,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getProjects: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: StackType.optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, locale, cursor, type } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      // get language selected
      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      const projectWhere = {
        ...(type ? { type } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      // get projects with skills and translations (tenant-scoped when present)
      const data = await ctx.db.project.findMany({
        include: {
          ProjectTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
          ProjectSkill: {
            include: {
              Skill: {
                include: {
                  SkillTranslation: {
                    where: {
                      appLanguageId: appLanguage?.id,
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: projectWhere,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });

      // first ProjectTranslation data should be at the same level as Project object
      const dataWithTranslation = data.map((project) => {
        const { ProjectTranslation, ProjectSkill, ...rest } = project;

        const skills = ProjectSkill.map(({ Skill }) => {
          const { SkillTranslation, ...val } = Skill;
          return mergeTranslation(val, SkillTranslation[0]);
        });

        return mergeTranslation({ skills, ...rest }, ProjectTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more projects to fetch (tenant-scoped)
      const hasMore = await ctx.db.project.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: projectWhere,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getSkills: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: z.array(StackType).optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, type, locale, cursor } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      // get language selected
      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      const skillWhere = {
        ...(type ? { type: { in: type } } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      // get skills with translations (tenant-scoped when present)
      const data = await ctx.db.skill.findMany({
        include: {
          SkillTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: skillWhere,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // first SkillTranslation data should be at the same level as Skill object
      const dataWithTranslation = data.map((skill) => {
        const { SkillTranslation, ...rest } = skill;

        return mergeTranslation(rest, SkillTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more skills to fetch (tenant-scoped)
      const hasMore = await ctx.db.skill.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: skillWhere,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getSkillDetail: publicProcedure
    .input(
      z.object({
        /** URL segment: title slug (e.g. `next-js`) or legacy ObjectId. */
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const skillInclude = {
        SkillTranslation: {
          where: { appLanguageId: appLanguage?.id },
        },
        CertificateSkill: {
          include: {
            Certification: {
              include: {
                CertificationTranslation: {
                  where: { appLanguageId: appLanguage?.id },
                },
              },
            },
          },
        },
        CvExperienceSkill: {
          include: { experience: true as const },
        },
        ProjectSkill: {
          include: {
            Project: {
              include: {
                ProjectTranslation: {
                  where: { appLanguageId: appLanguage?.id },
                },
                ProjectSkill: {
                  include: {
                    Skill: {
                      include: {
                        SkillTranslation: {
                          where: { appLanguageId: appLanguage?.id },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const tenantWhere = tenantUserId ? { userId: tenantUserId } : {};

      let skill = looksLikeSkillObjectId(input.slug)
        ? await ctx.db.skill.findFirst({
            where: { id: input.slug, ...tenantWhere },
            include: skillInclude,
          })
        : null;

      if (!skill) {
        const candidates = await ctx.db.skill.findMany({
          where: tenantWhere,
          include: skillInclude,
        });
        skill =
          candidates.find(
            (row) => skillSlugFromTitle(row.title) === input.slug,
          ) ?? null;
      }

      if (!skill) return null;

      const {
        SkillTranslation,
        CertificateSkill,
        CvExperienceSkill,
        ProjectSkill,
        ...rest
      } = skill;

      const certificates = CertificateSkill.map(({ Certification }) => {
        const { CertificationTranslation, ...cert } = Certification;
        return mergeTranslation(cert, CertificationTranslation[0]);
      });

      const experiences = CvExperienceSkill.map(({ experience }) => ({
        id: experience.id,
        company: experience.company,
        role: getLocalizedText(experience.role, input.locale),
        dates: formatExperienceDates(
          experience.startDate,
          experience.endDate,
          experience.current,
          input.locale,
        ),
        order: experience.order,
      })).sort((a, b) => a.order - b.order);

      const projects = ProjectSkill.map(({ Project }) => {
        const {
          ProjectTranslation,
          ProjectSkill: nestedSkills,
          ...project
        } = Project;

        const skills = nestedSkills.map(({ Skill }) => {
          const { SkillTranslation, ...val } = Skill;
          return mergeTranslation(val, SkillTranslation[0]);
        });

        return mergeTranslation({ ...project, skills }, ProjectTranslation[0]);
      });

      return {
        ...mergeTranslation(rest, SkillTranslation[0]),
        certificates,
        experiences,
        projects,
      };
    }),
  getTimelinePublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().int().positive().optional(),
        category: z.enum(["WORK", "STUDY", "COURSE"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      if (!tenantUserId) {
        return [];
      }

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: {
          userId: tenantUserId,
          ...(input.category ? { category: input.category } : {}),
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(
        timelineItems,
        locale,
        defaultLocale,
        input.limit,
      );
    }),

  getTimeline: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      if (!tenantUserId) {
        return [];
      }

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: { userId: tenantUserId },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(timelineItems, locale, defaultLocale).map(
        (item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.date,
          dateTime: item.dateTime,
        }),
      );
    }),

  getHeroPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const header = await ctx.db.cvHeader.findUnique({
        where: { userId: tenantUserId },
      });

      if (!header) return null;

      const profile = await ctx.db.profile.findUnique({
        where: { userId: tenantUserId },
        select: { displayName: true },
      });

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      return {
        fullName: profile?.displayName?.trim() ?? header.fullName,
        photoUrl: header.photoUrl,
        backgroundImageUrl: header.backgroundImageUrl,
        heroSubtitle: getLocalizedText(
          header.heroSubtitle,
          locale,
          defaultLocale,
        ),
        heroTagline: getLocalizedText(
          header.heroTagline,
          locale,
          defaultLocale,
        ),
        heroSummary: getLocalizedText(
          header.heroSummary,
          locale,
          defaultLocale,
        ),
        imageAlt: getLocalizedText(
          header.clientImageAlt,
          locale,
          defaultLocale,
        ),
      };
    }),

  getStatsPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId)
        return { projectsCount: 0, certificationsCount: 0, yearsExperience: 0 };

      const [projectsCount, certificationsCount, firstExperience] =
        await Promise.all([
          ctx.db.project.count({ where: { userId: tenantUserId } }),
          ctx.db.certification.count({ where: { userId: tenantUserId } }),
          ctx.db.cvExperience.findFirst({
            where: { userId: tenantUserId, startDate: { not: null } },
            orderBy: { startDate: "asc" },
            select: { startDate: true },
          }),
        ]);

      const yearsExperience = firstExperience?.startDate
        ? Math.floor(
            (new Date().getTime() - firstExperience.startDate.getTime()) /
              (1000 * 60 * 60 * 24 * 365.25),
          )
        : 0;

      return {
        projectsCount,
        certificationsCount,
        yearsExperience,
      };
    }),

  getAboutPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      const [aboutMe, terminal] = await Promise.all([
        ctx.db.cvAboutMe.findUnique({ where: { userId: tenantUserId } }),
        ctx.db.cvTerminal.findUnique({
          where: { userId: tenantUserId },
          include: { steps: true },
        }),
      ]);

      const aboutText = getLocalizedText(
        aboutMe?.aboutMe,
        locale,
        defaultLocale,
      );

      return {
        paragraphs: splitAboutParagraphs(aboutText),
        hasTerminal: Boolean(terminal && terminal.steps.length > 0),
      };
    }),

  getSoftSkillsPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      if (!tenantUserId) {
        return {
          section: {
            mediaType: "VIDEO" as const,
            videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
            posterUrl: DEFAULT_SOFT_SKILLS_POSTER_URL,
            imageUrl: null,
          },
          items: [],
        };
      }

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      const [section, items] = await Promise.all([
        ctx.db.softSkillsSection.findUnique({
          where: { userId: tenantUserId },
        }),
        ctx.db.portfolioSoftSkill.findMany({
          where: { userId: tenantUserId, isVisible: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        }),
      ]);

      return {
        section: {
          mediaType: section?.mediaType ?? "VIDEO",
          videoUrl: section?.videoUrl ?? DEFAULT_SOFT_SKILLS_VIDEO_URL,
          posterUrl: section?.posterUrl ?? DEFAULT_SOFT_SKILLS_POSTER_URL,
          imageUrl: section?.imageUrl ?? null,
        },
        items: items.map((item) => ({
          id: item.id,
          icon: item.icon,
          featured: item.featured,
          title: getLocalizedText(item.title, locale, defaultLocale),
          description: getLocalizedText(
            item.description,
            locale,
            defaultLocale,
          ),
        })),
      };
    }),

  getExperiencesPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().int().positive().max(10).optional().default(4),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      // Prefer explicitly featured experiences; fall back to order-based limit
      // so existing accounts without the flag set still work.
      let experiences = await ctx.db.cvExperience.findMany({
        where: { userId: tenantUserId, featuredOnHome: true },
        include: {
          responsibilities: { orderBy: { order: "asc" } },
        },
        orderBy: [{ order: "asc" }, { startDate: "desc" }],
      });

      if (experiences.length === 0) {
        experiences = await ctx.db.cvExperience.findMany({
          where: { userId: tenantUserId },
          include: {
            responsibilities: { orderBy: { order: "asc" } },
          },
          orderBy: [{ order: "asc" }, { startDate: "desc" }],
          take: input.limit,
        });
      }

      return experiences.map((experience) => ({
        id: experience.id,
        company: experience.company,
        companyLogoUrl: experience.companyLogoUrl,
        current: experience.current,
        role: getLocalizedText(experience.role, locale, defaultLocale),
        dates: formatExperienceDates(
          experience.startDate,
          experience.endDate,
          experience.current,
          locale,
        ),
        responsibilities: experience.responsibilities.map((responsibility) =>
          getLocalizedText(responsibility.text, locale, defaultLocale),
        ),
      }));
    }),

  getTestimonialsPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().int().positive().max(10).optional().default(3),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const defaultLocale = ctx.tenant?.defaultLocale ?? "en";
      const locale = input.locale;

      const items = await ctx.db.testimonial.findMany({
        where: { userId: tenantUserId, isVisible: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        take: input.limit,
      });

      return items.map((item) => ({
        id: item.id,
        author: item.author,
        role: item.role,
        quote: getLocalizedText(item.quote, locale, defaultLocale),
        avatarUrl: item.avatarUrl,
        linkedInUrl: item.linkedInUrl,
      }));
    }),

  getProjectBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const project = await ctx.db.project.findFirst({
        where: {
          userId: tenantUserId,
          slug: input.slug,
          caseStudyEnabled: true,
        },
        include: {
          ProjectTranslation: {
            where: { appLanguageId: appLanguage?.id },
          },
          ProjectSkill: {
            include: {
              Skill: {
                include: {
                  SkillTranslation: {
                    where: { appLanguageId: appLanguage?.id },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) return null;

      const translation = project.ProjectTranslation[0];
      if (!translation) return null;

      const skills = project.ProjectSkill.map(({ Skill }) => {
        const { SkillTranslation, ...rest } = Skill;
        return mergeTranslation(rest, SkillTranslation[0]);
      });

      return {
        id: project.id,
        slug: project.slug,
        image: project.image,
        type: project.type,
        kind: project.kind,
        githubUrl: project.githubUrl,
        websiteUrl: project.websiteUrl,
        isPrivate: project.isPrivate,
        title: translation.title,
        description: translation.description,
        hook: translation.hook,
        challenge: translation.challenge,
        approach: translation.approach,
        outcome: translation.outcome,
        skills,
      };
    }),

  getNextCaseStudyProject: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const projects = await ctx.db.project.findMany({
        where: {
          userId: tenantUserId,
          caseStudyEnabled: true,
          slug: { not: null },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          ProjectTranslation: {
            where: { appLanguageId: appLanguage?.id },
          },
        },
      });

      const slugs = projects
        .map((project) => {
          const translation = project.ProjectTranslation[0];
          if (!project.slug || !translation) return null;
          return { slug: project.slug, title: translation.title };
        })
        .filter(
          (project): project is { slug: string; title: string } =>
            project !== null,
        );

      if (slugs.length < 2) return null;

      const currentIndex = slugs.findIndex(
        (project) => project.slug === input.slug,
      );
      if (currentIndex === -1) return null;

      return slugs[(currentIndex + 1) % slugs.length] ?? null;
    }),
});
