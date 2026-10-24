import { z } from "zod";

import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { splitAboutParagraphs } from "@/features/profile/lib/about-utils";
import { mapTimelineItemsToPublic } from "@/features/timeline/lib/map-timeline-public";
import { caseStudyRowToDto } from "@/features/projects/lib/case-study";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  looksLikeSkillObjectId,
  skillSlugFromTitle,
} from "@/utils/tools/skill-slug";
import { formatExperienceDates } from "@/utils/tools/date";

const LanguageCode = z.enum(["es", "en", "nl"]);
const StackType = z.enum([
  "AI",
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
  "ARCHITECTURE",
  "DATA",
  "QUALITY_DELIVERY",
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

function toIsoOrNull(val?: Date | string | null): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return null;
}

interface ProjectRecordForList {
  id: string;
  image: string;
  type: z.infer<typeof StackType>;
  githubUrl: string | null;
  websiteUrl: string | null;
  isPrivate: boolean;
  order: number;
  kind?: string | null;
  slug: string | null;
  caseStudyEnabled: boolean;
  status?: string | null;
  startedAt?: Date | string | null;
  endedAt?: Date | string | null;
  teamSize?: number | null;
  ProjectTranslation: {
    title?: string;
    description?: string;
    caseStudy?: {
      tldr?: { title?: string | null; value?: string | null }[];
      sections?: { kind?: string; items?: unknown[] }[];
      facts?: unknown[];
    } | null;
  }[];
  ProjectSkill: {
    Skill: {
      id: string;
      title: string;
      image?: string | null;
      type: z.infer<typeof StackType>;
      SkillTranslation?: { id?: string; [key: string]: unknown }[];
      [key: string]: unknown;
    };
  }[];
}

function formatProjectListItem(project: ProjectRecordForList) {
  const translation = project.ProjectTranslation[0];
  const skills = project.ProjectSkill.map(({ Skill }) => {
    const { SkillTranslation, ...rest } = Skill;
    return mergeTranslation(rest, SkillTranslation?.[0]);
  });

  const cs = translation?.caseStudy;
  const decisionsCount =
    cs?.sections?.find((s) => s.kind === "DECISIONS")?.items?.length ?? 0;
  const hasLayers = Boolean(cs?.sections?.some((s) => s.kind === "LAYERS"));
  const metricsCount =
    cs?.sections?.find((s) => s.kind === "METRICS")?.items?.length ??
    cs?.facts?.length ??
    0;

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
    kind: project.kind ?? "PERSONAL",
    slug: project.slug,
    caseStudyEnabled: project.caseStudyEnabled,
    highlights:
      cs?.tldr
        ?.map((item) => (item.value?.trim() ? item.value : (item.title ?? "")))
        .filter(Boolean)
        .slice(0, 3) ?? [],
    status: project.status ?? null,
    startedAt: toIsoOrNull(project.startedAt),
    endedAt: toIsoOrNull(project.endedAt),
    teamSize: project.teamSize ?? null,
    csInfo:
      project.caseStudyEnabled && cs
        ? {
            decisions: decisionsCount,
            layers: hasLayers,
            metrics: metricsCount,
          }
        : null,
    skills,
  };
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
      if (!tenantUserId) {
        return { certificates: [], cursor: null };
      }

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      const baseWhere = {
        userId: tenantUserId,
        ...(type ? { type: { hasSome: type } } : {}),
      };

      const data = await ctx.db.certification.findMany({
        include: {
          CertificationTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
          CertificateSkill: {
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
        take: limit,
        skip: cursor ? 1 : 0,
        where: baseWhere,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ issuedDate: "desc" }, { createdAt: "desc" }],
      });

      const dataWithTranslation = data.map((certification) => {
        const { CertificationTranslation, CertificateSkill, ...rest } =
          certification;
        const skills = (CertificateSkill ?? []).map(({ Skill }) => {
          const { SkillTranslation, ...skillRest } = Skill;
          return mergeTranslation(skillRest, SkillTranslation?.[0]);
        });

        return {
          ...mergeTranslation(rest, CertificationTranslation?.[0]),
          skills,
        };
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
        limit: z.number().int().positive().max(100).optional().default(10),
        cursor: z.string().nullish(),
        locale: LanguageCode.optional().default("en"),
        type: StackType.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, locale, type } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId)
        return {
          projects: [],
          nextCursor: null,
          totalCount: 0,
          caseStudyCount: 0,
        };

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: locale },
      });

      const [totalCount, caseStudyCount, projects] = await Promise.all([
        ctx.db.project.count({ where: { userId: tenantUserId } }),
        ctx.db.project.count({
          where: { userId: tenantUserId, caseStudyEnabled: true },
        }),
        ctx.db.project.findMany({
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
        }),
      ]);

      let nextCursor: typeof cursor = null;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem?.id ?? null;
      }

      const formatted = projects.map(formatProjectListItem);

      return {
        projects: formatted,
        nextCursor,
        totalCount,
        caseStudyCount,
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

      return projects.map(formatProjectListItem);
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
        companyLogoUrl: experience.companyLogoUrl,
        role: field(experience.translations, "role"),
        dates: formatExperienceDates(
          experience.startDate,
          experience.endDate,
          experience.current,
          input.locale,
        ),
        order: experience.order,
      })).sort((a, b) => a.order - b.order);

      const projects = ProjectSkill.map(({ Project }) =>
        formatProjectListItem(Project),
      );

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
        include: {
          TimelineItemTranslation: true,
          TimelineItemSkill: {
            include: {
              skill: true,
            },
          },
        },
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
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

      const [languages, header, profile] = await Promise.all([
        ctx.db.appLanguage.findMany(),
        ctx.db.cvHeader.findUnique({
          where: { userId: tenantUserId },
          include: { translations: true },
        }),
        ctx.db.profile.findUnique({
          where: { userId: tenantUserId },
          select: { displayName: true },
        }),
      ]);

      if (!header) return null;

      const locale = input.locale;
      const t = createLocalizedFieldResolver(languages, locale).for(
        header.translations ?? [],
      );

      const availabilityBadgeText = t("availabilityBadge");

      return {
        fullName: profile?.displayName?.trim() ?? header.fullName,
        photoUrl: header.photoUrl,
        backgroundImageUrl: header.backgroundImageUrl,
        heroSubtitle: t("heroSubtitle"),
        heroTagline: t("heroTagline"),
        heroSummary: t("heroSummary"),
        imageAlt: t("clientImageAlt"),
        availabilityBadge: availabilityBadgeText?.trim() || null,
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
        return {
          projectsCount: 0,
          certificationsCount: 0,
          yearsExperience: 0,
          engineersMentored: 0,
        };

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
        projectsCount: Math.max(19, projectsCount),
        certificationsCount,
        engineersMentored: 6,
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

      const languages = await ctx.db.appLanguage.findMany();
      const locale = input.locale;
      const field = createLocalizedFieldResolver(languages, locale);

      const services = await ctx.db.service.findMany({
        where: { userId: tenantUserId, isActive: true },
        include: {
          ServiceTranslation: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });

      return services.map((service) => {
        const t = field.for(service.ServiceTranslation);

        return {
          id: service.id,
          image: service.image,
          type: service.type,
          icon: service.icon ?? undefined,
          statsValue: service.statsValue ?? undefined,
          featured: service.featured,
          order: service.order,
          title: t("title"),
          description: t("description"),
          badge: t("badge"),
          statsLabel: t("statsLabel"),
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
          include: {
            metrics: {
              include: { SoftSkillsMetricTranslation: true },
              orderBy: { order: "asc" },
            },
          },
        }),
        ctx.db.portfolioSoftSkill.findMany({
          where: { userId: tenantUserId, isVisible: true },
          include: { PortfolioSoftSkillTranslation: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        }),
      ]);

      const mappedItems = items.map((item) => {
        const t = field.for(item.PortfolioSoftSkillTranslation);
        return {
          id: item.id,
          icon: item.icon,
          featured: item.featured,
          title: t("title"),
          description: t("description"),
          badge: t("badge"),
        };
      });

      const sectionMetrics = (section?.metrics ?? []).map((m) => ({
        value: m.value,
        label: field(m.SoftSkillsMetricTranslation, "label"),
      }));

      return {
        section: {
          mediaType: section?.mediaType ?? "VIDEO",
          videoUrl: section?.videoUrl ?? DEFAULT_SOFT_SKILLS_VIDEO_URL,
          posterUrl: section?.posterUrl ?? DEFAULT_SOFT_SKILLS_POSTER_URL,
          imageUrl: section?.imageUrl ?? null,
        },
        metrics: sectionMetrics,
        items: mappedItems,
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
          CvExperienceSkill: {
            include: { skill: { select: { title: true } } },
          },
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
            CvExperienceSkill: {
              include: { skill: { select: { title: true } } },
            },
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
        const relatedSkillTitles =
          experience.CvExperienceSkill?.map((s) => s.skill.title) ?? [];

        const parsedMetrics = (() => {
          if (!experience.skills) return [];
          try {
            const parsed = JSON.parse(experience.skills) as unknown;
            if (Array.isArray(parsed)) return parsed as string[];
            if (typeof parsed === "object" && parsed !== null) {
              const obj = parsed as Record<string, string[]>;
              return obj[locale] ?? obj.es ?? obj.en ?? [];
            }
          } catch {
            return experience.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          return [];
        })();

        return {
          id: experience.id,
          company: experience.company,
          companyLogoUrl: experience.companyLogoUrl,
          employmentType: experience.employmentType ?? "FULL_TIME",
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
          metrics: parsedMetrics,
          skills: relatedSkillTitles,
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
        kind: project.kind ?? "PERSONAL",
        githubUrl: project.githubUrl,
        websiteUrl: project.websiteUrl,
        isPrivate: project.isPrivate,
        status: project.status,
        startedAt: project.startedAt,
        endedAt: project.endedAt,
        teamSize: project.teamSize,
        title: translation.title,
        description: translation.description,
        caseStudy: caseStudyRowToDto(translation.caseStudy ?? null),
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
          return {
            slug: project.slug,
            title: translation.title,
            image: project.image,
            summary: translation.description,
            nextProjectSlug: translation.caseStudy?.nextProjectSlug ?? null,
          };
        })
        .filter(
          (
            project,
          ): project is {
            slug: string;
            title: string;
            image: string;
            summary: string;
            nextProjectSlug: string | null;
          } => project !== null,
        );

      const currentIndex = slugs.findIndex(
        (project) => project.slug === input.slug,
      );
      if (currentIndex === -1 || slugs.length < 2) return null;

      const currentProject = slugs[currentIndex];
      if (!currentProject) return null;

      // Canonical sequence: next project in catalog order, wrapping around from last to first
      const nextIndex = (currentIndex + 1) % slugs.length;
      const sequentialNext = slugs[nextIndex] ?? null;

      // If a custom nextProjectSlug is configured, ensure it doesn't create a 2-way loop (A <-> B) or self-loop
      if (currentProject.nextProjectSlug) {
        const customNext = slugs.find(
          (project) => project.slug === currentProject.nextProjectSlug,
        );
        if (
          customNext &&
          customNext.slug !== currentProject.slug &&
          customNext.nextProjectSlug !== currentProject.slug
        ) {
          return customNext;
        }
      }

      return sequentialNext;
    }),

  getShowcasePortfolios: publicProcedure
    .input(
      z
        .object({
          locale: LanguageCode.optional().default("en"),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const locale = input?.locale ?? "en";
      const [languages, profiles] = await Promise.all([
        ctx.db.appLanguage.findMany(),
        ctx.db.profile.findMany({
          where: { isPublished: true },
          select: {
            id: true,
            username: true,
            displayName: true,
            logoInitials: true,
            customDomain: true,
            userId: true,
          },
          take: 12,
        }),
      ]);

      if (profiles.length === 0) {
        return [];
      }

      const userIds = profiles.map((p) => p.userId);
      const headers = await ctx.db.cvHeader.findMany({
        where: { userId: { in: userIds } },
        include: { translations: true },
      });

      const headerByUserId = new Map(headers.map((h) => [h.userId, h]));

      return profiles
        .filter((p) => Boolean(p.username))
        .map((p) => {
          const header = headerByUserId.get(p.userId);
          const t = header
            ? createLocalizedFieldResolver(languages, locale).for(
                header.translations ?? [],
              )
            : null;

          const subtitle = t?.("heroSubtitle")?.trim();
          const degree = t?.("degree")?.trim();
          const role =
            subtitle && subtitle.length > 0
              ? subtitle
              : degree && degree.length > 0
                ? degree
                : null;

          const trimmedInitials = p.logoInitials?.trim();
          const trimmedDisplayName = p.displayName?.trim();
          const initials =
            trimmedInitials && trimmedInitials.length > 0
              ? trimmedInitials
              : trimmedDisplayName && trimmedDisplayName.length > 0
                ? trimmedDisplayName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")
                : p.username.slice(0, 2).toUpperCase();

          return {
            id: p.id,
            username: p.username,
            displayName: p.displayName,
            subdomain: p.customDomain ?? p.username,
            initials,
            role,
          };
        });
    }),
});
