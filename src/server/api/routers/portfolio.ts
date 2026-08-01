import { z } from "zod";

import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
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

      const dataWithTranslation = data.map((certification) => {
        const { CertificationTranslation, ...rest } = certification;

        return mergeTranslation(rest, CertificationTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      return {
        certificates: dataWithTranslation,
        cursor: lastCursor,
      };
    }),

  getProjects: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(50).optional().default(10),
        cursor: z.string().nullish(),
        locale: LanguageCode.optional().default("en"),
        type: StackType.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, locale, type } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return { projects: [], nextCursor: null };

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: locale },
      });

      const projects = await ctx.db.project.findMany({
        where: {
          userId: tenantUserId,
          type,
        },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
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

      let nextCursor: typeof cursor = null;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem?.id ?? null;
      }

      const formatted = projects.map((project) => {
        const translation = project.ProjectTranslation[0];
        const skills = project.ProjectSkill.map(({ Skill }) => {
          const { SkillTranslation, ...rest } = Skill;
          return mergeTranslation(rest, SkillTranslation[0]);
        });

        return {
          id: project.id,
          title: translation?.title ?? "",
          description: translation?.description ?? "",
          image: project.image,
          type: project.type,
          githubUrl: project.githubUrl,
          websiteUrl: project.websiteUrl,
          isPrivate: project.isPrivate,
          order: project.order,
          kind: project.kind,
          slug: project.slug,
          caseStudyEnabled: project.caseStudyEnabled,
          hook: translation?.hook ?? null,
          skills,
        };
      });

      return {
        projects: formatted,
        nextCursor,
      };
    }),

  getFeaturedProjects: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().int().positive().max(10).optional().default(6),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const projects = await ctx.db.project.findMany({
        where: { userId: tenantUserId },
        take: input.limit,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
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

      return projects.map((project) => {
        const translation = project.ProjectTranslation[0];
        const skills = project.ProjectSkill.map(({ Skill }) => {
          const { SkillTranslation, ...rest } = Skill;
          return mergeTranslation(rest, SkillTranslation[0]);
        });

        return {
          id: project.id,
          title: translation?.title ?? "",
          description: translation?.description ?? "",
          image: project.image,
          type: project.type,
          githubUrl: project.githubUrl,
          websiteUrl: project.websiteUrl,
          isPrivate: project.isPrivate,
          order: project.order,
          kind: project.kind,
          slug: project.slug,
          caseStudyEnabled: project.caseStudyEnabled,
          skills,
        };
      });
    }),

  getSkills: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: input.locale,
        },
      });

      const data = await ctx.db.skill.findMany({
        where: { userId: tenantUserId },
        orderBy: { createdAt: "asc" },
        include: {
          SkillTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
      });

      return data.map((skill) => {
        const { SkillTranslation, ...rest } = skill;
        return mergeTranslation(rest, SkillTranslation[0]);
      });
    }),

  getSkillBySlug: publicProcedure
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

      const isObjId = looksLikeSkillObjectId(input.slug);
      let skill = await ctx.db.skill.findFirst({
        where: {
          userId: tenantUserId,
          ...(isObjId
            ? { OR: [{ id: input.slug }, { title: input.slug }] }
            : { title: { contains: input.slug, mode: "insensitive" } }),
        },
        include: {
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
            include: {
              experience: {
                include: { translations: true },
              },
            },
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
        },
      });

      if (!skill && !isObjId) {
        const allSkills = await ctx.db.skill.findMany({
          where: { userId: tenantUserId },
          select: { id: true, title: true },
        });

        const matched = allSkills.find(
          (s) => skillSlugFromTitle(s.title) === input.slug.toLowerCase(),
        );

        if (matched) {
          skill = await ctx.db.skill.findFirst({
            where: { id: matched.id },
            include: {
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
                include: {
                  experience: {
                    include: { translations: true },
                  },
                },
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
            },
          });
        }
      }

      if (!skill) return null;

      const languages = await ctx.db.appLanguage.findMany();
      const field = createLocalizedFieldResolver(languages, input.locale);
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
        role: field(experience.translations, "role"),
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: {
          userId: tenantUserId,
          ...(input.category ? { category: input.category } : {}),
        },
        include: { TimelineItemTranslation: true },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(
        timelineItems,
        locale,
        languages,
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: { userId: tenantUserId },
        include: { TimelineItemTranslation: true },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(timelineItems, locale, languages).map(
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

      const languages = await ctx.db.appLanguage.findMany();
      const header = await ctx.db.cvHeader.findUnique({
        where: { userId: tenantUserId },
        include: { translations: true },
      });

      if (!header) return null;

      const profile = await ctx.db.profile.findUnique({
        where: { userId: tenantUserId },
        select: { displayName: true },
      });

      const locale = input.locale;
      const t = createLocalizedFieldResolver(languages, locale).for(
        header.translations ?? [],
      );

      return {
        fullName: profile?.displayName?.trim() ?? header.fullName,
        photoUrl: header.photoUrl,
        backgroundImageUrl: header.backgroundImageUrl,
        heroSubtitle: t("heroSubtitle"),
        heroTagline: t("heroTagline"),
        heroSummary: t("heroSummary"),
        imageAlt: t("clientImageAlt"),
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

  getServicesPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const services = await ctx.db.service.findMany({
        where: { userId: tenantUserId },
        include: {
          ServiceTranslation: {
            where: { appLanguageId: appLanguage?.id },
          },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });

      return services.map((service) => {
        const translation = service.ServiceTranslation[0];

        return {
          id: service.id,
          image: service.image,
          type: service.type,
          icon: service.icon ?? undefined,
          statsValue: service.statsValue ?? undefined,
          featured: service.featured,
          order: service.order,
          title: translation?.title ?? "",
          description: translation?.description ?? "",
          badge: translation?.badge ?? "",
          statsLabel: translation?.statsLabel ?? "",
        };
      });
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

      const languages = await ctx.db.appLanguage.findMany();

      const [aboutMe, terminal] = await Promise.all([
        ctx.db.cvAboutMe.findUnique({
          where: { userId: tenantUserId },
          include: { translations: true },
        }),
        ctx.db.cvTerminal.findUnique({
          where: { userId: tenantUserId },
          include: { steps: true },
        }),
      ]);

      const aboutText = createLocalizedFieldResolver(languages, input.locale)(
        aboutMe?.translations ?? [],
        "aboutMe",
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;
      const field = createLocalizedFieldResolver(languages, locale);

      const [section, items] = await Promise.all([
        ctx.db.softSkillsSection.findUnique({
          where: { userId: tenantUserId },
        }),
        ctx.db.portfolioSoftSkill.findMany({
          where: { userId: tenantUserId, isVisible: true },
          include: { PortfolioSoftSkillTranslation: true },
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
        items: items.map((item) => {
          const t = field.for(item.PortfolioSoftSkillTranslation);
          return {
            id: item.id,
            icon: item.icon,
            featured: item.featured,
            title: t("title"),
            description: t("description"),
            badge: t("badge"),
          };
        }),
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;
      const field = createLocalizedFieldResolver(languages, locale);

      let experiences = await ctx.db.cvExperience.findMany({
        where: { userId: tenantUserId, featuredOnHome: true },
        include: {
          translations: true,
          responsibilities: {
            include: { translations: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: [{ order: "asc" }, { startDate: "desc" }],
      });

      if (experiences.length === 0) {
        experiences = await ctx.db.cvExperience.findMany({
          where: { userId: tenantUserId },
          include: {
            translations: true,
            responsibilities: {
              include: { translations: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: [{ order: "asc" }, { startDate: "desc" }],
          take: input.limit,
        });
      }

      return experiences.map((experience) => {
        const expT = field.for(experience.translations);
        return {
          id: experience.id,
          company: experience.company,
          companyLogoUrl: experience.companyLogoUrl,
          startDate: experience.startDate,
          endDate: experience.endDate,
          current: experience.current,
          dates: formatExperienceDates(
            experience.startDate,
            experience.endDate,
            experience.current,
            locale,
          ),
          role: expT("role"),
          location: expT("location"),
          responsibilities: experience.responsibilities.map((responsibility) =>
            field(responsibility.translations, "text"),
          ),
        };
      });
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;
      const field = createLocalizedFieldResolver(languages, locale);

      const items = await ctx.db.testimonial.findMany({
        where: { userId: tenantUserId, isVisible: true },
        include: { TestimonialTranslation: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        take: input.limit,
      });

      return items.map((item) => ({
        id: item.id,
        author: item.author,
        role: item.role,
        quote: field(item.TestimonialTranslation, "quote"),
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

      const nextIndex = (currentIndex + 1) % slugs.length;
      return slugs[nextIndex];
    }),
});
