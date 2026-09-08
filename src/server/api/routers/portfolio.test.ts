import { portfolioRouter } from "./portfolio";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

describe("portfolioRouter", () => {
  it("returns empty public collections without a tenant", async () => {
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );

    await expect(
      caller.getCertificates({ limit: 10, locale: "en" }),
    ).resolves.toEqual({ certificates: [], cursor: null });
    await expect(caller.getSkills({ locale: "en" })).resolves.toEqual([]);
    await expect(
      caller.getSkillBySlug({ slug: "react", locale: "en" }),
    ).resolves.toBeNull();
  });

  it("maps certificate translations for a tenant", async () => {
    const db = {
      appLanguage: {
        findUnique: jest.fn().mockResolvedValue({ id: "lang-en", code: "en" }),
      },
      certification: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "cert-1",
            company: "AWS",
            CertificationTranslation: [{ id: "t1", title: "Architect" }],
          },
        ]),
      },
    };
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getCertificates({
      limit: 5,
      locale: "en",
      type: ["BACKEND"],
    });
    expect(result.certificates[0]).toMatchObject({
      id: "cert-1",
      title: "Architect",
    });
    expect(result.cursor).toBe("cert-1");
  });

  it("maps skill translations", async () => {
    const db = {
      appLanguage: {
        findUnique: jest.fn().mockResolvedValue({ id: "lang-en", code: "en" }),
      },
      skill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "sk-1",
            title: "React",
            SkillTranslation: [{ id: "t1", description: "UI" }],
          },
        ]),
      },
    };
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db }),
    );
    const skills = await caller.getSkills({ locale: "en" });
    expect(skills[0]).toMatchObject({
      id: "sk-1",
      title: "React",
      description: "UI",
    });
  });

  it("returns empty projects and hero without a tenant", async () => {
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.getProjects({ locale: "en" })).resolves.toEqual({
      projects: [],
      nextCursor: null,
    });
    await expect(caller.getFeaturedProjects({ locale: "en" })).resolves.toEqual(
      [],
    );
    await expect(caller.getHeroPublic({ locale: "en" })).resolves.toBeNull();
    await expect(caller.getStatsPublic({ locale: "en" })).resolves.toEqual({
      projectsCount: 0,
      certificationsCount: 0,
      yearsExperience: 0,
    });
  });

  it("formats projects and stats for a tenant", async () => {
    const db = {
      appLanguage: {
        findUnique: jest.fn().mockResolvedValue({ id: "lang-en", code: "en" }),
        findMany: jest.fn().mockResolvedValue([{ id: "lang-en", code: "en" }]),
      },
      project: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "pr-1",
            image: "https://cdn.example/p.png",
            type: "FRONTEND",
            githubUrl: null,
            websiteUrl: null,
            isPrivate: false,
            order: 0,
            kind: "PERSONAL",
            slug: "eleven",
            caseStudyEnabled: true,
            ProjectTranslation: [
              { title: "Eleven", description: "App", hook: "Hook" },
            ],
            ProjectSkill: [
              {
                Skill: {
                  id: "sk-1",
                  title: "React",
                  SkillTranslation: [{ description: "UI" }],
                },
              },
            ],
          },
        ]),
        count: jest.fn().mockResolvedValue(3),
      },
      certification: { count: jest.fn().mockResolvedValue(8) },
      cvExperience: {
        findFirst: jest.fn().mockResolvedValue({
          startDate: new Date("2020-01-01"),
        }),
      },
      cvHeader: {
        findUnique: jest.fn().mockResolvedValue({
          fullName: "Ada",
          photoUrl: null,
          backgroundImageUrl: null,
          translations: [
            {
              appLanguageId: "lang-en",
              heroSummary: "Builder",
              heroSubtitle: "Hi",
              heroTagline: "Tag",
              clientImageAlt: "Portrait",
            },
          ],
        }),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ displayName: "Ada L." }),
      },
    };
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db }),
    );

    const projects = await caller.getProjects({ locale: "en", limit: 10 });
    expect(projects.projects[0]?.title).toBe("Eleven");
    expect(projects.projects[0]?.skills[0]?.title).toBe("React");

    const featured = await caller.getFeaturedProjects({ locale: "en" });
    expect(featured[0]?.title).toBe("Eleven");

    const hero = await caller.getHeroPublic({ locale: "en" });
    expect(hero?.fullName).toBe("Ada L.");
    expect(hero?.heroSummary).toBe("Builder");

    const stats = await caller.getStatsPublic({ locale: "en" });
    expect(stats.projectsCount).toBe(3);
    expect(stats.certificationsCount).toBe(8);
    expect(stats.yearsExperience).toBeGreaterThanOrEqual(5);
  });

  it("returns empty public collections without a tenant", async () => {
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.getTimelinePublic({ locale: "en" })).resolves.toEqual(
      [],
    );
    await expect(caller.getServicesPublic({ locale: "en" })).resolves.toEqual(
      [],
    );
    await expect(caller.getAboutPublic({ locale: "en" })).resolves.toBeNull();
    await expect(
      caller.getExperiencesPublic({ locale: "en" }),
    ).resolves.toEqual([]);
    await expect(
      caller.getTestimonialsPublic({ locale: "en" }),
    ).resolves.toEqual([]);
    await expect(
      caller.getProjectBySlug({ slug: "eleven", locale: "en" }),
    ).resolves.toBeNull();
    await expect(
      caller.getNextCaseStudyProject({ slug: "eleven", locale: "en" }),
    ).resolves.toBeNull();

    const soft = await caller.getSoftSkillsPublic({ locale: "en" });
    expect(soft.items).toEqual([]);
    expect(soft.section.mediaType).toBe("VIDEO");
  });

  it("maps timeline, services, about, soft skills, and case studies", async () => {
    const languages = [{ id: "lang-en", code: "en" }];
    const db = {
      appLanguage: {
        findUnique: jest.fn().mockResolvedValue({ id: "lang-en", code: "en" }),
        findMany: jest.fn().mockResolvedValue(languages),
      },
      timelineItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "tl-1",
            organization: "Acme",
            location: "Remote",
            category: "WORK",
            startDate: new Date("2020-01-01"),
            endDate: null,
            current: true,
            images: [],
            order: 0,
            TimelineItemTranslation: [
              {
                appLanguageId: "lang-en",
                title: "Engineer",
                description: "Shipped",
              },
            ],
          },
        ]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "svc-1",
            image: "https://cdn.example/s.png",
            type: "FRONTEND",
            icon: "Code",
            statsValue: "10+",
            featured: true,
            order: 0,
            ServiceTranslation: [
              {
                title: "Web apps",
                description: "I build them",
                badge: "New",
                statsLabel: "Projects",
              },
            ],
          },
        ]),
      },
      cvAboutMe: {
        findUnique: jest.fn().mockResolvedValue({
          translations: [
            { appLanguageId: "lang-en", aboutMe: "Hello\n\nWorld" },
          ],
        }),
      },
      cvTerminal: {
        findUnique: jest.fn().mockResolvedValue({ steps: [{ id: "st-1" }] }),
      },
      softSkillsSection: {
        findUnique: jest.fn().mockResolvedValue({
          mediaType: "VIDEO",
          videoUrl: "https://cdn.example/v.webm",
          posterUrl: "https://cdn.example/p.webp",
          imageUrl: null,
        }),
      },
      portfolioSoftSkill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "ss-1",
            icon: "RiTeamLine",
            featured: true,
            PortfolioSoftSkillTranslation: [
              {
                appLanguageId: "lang-en",
                title: "Teamwork",
                description: "Collab",
                badge: "Lead",
              },
            ],
          },
        ]),
      },
      cvExperience: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "exp-1",
            company: "Acme",
            companyLogoUrl: null,
            startDate: new Date("2020-01-01"),
            endDate: null,
            current: true,
            translations: [
              {
                appLanguageId: "lang-en",
                role: "Engineer",
                location: "Remote",
              },
            ],
            responsibilities: [
              {
                translations: [
                  { appLanguageId: "lang-en", text: "Shipped UI" },
                ],
              },
            ],
          },
        ]),
      },
      testimonial: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "t-1",
            author: "Grace",
            role: "Manager",
            avatarUrl: null,
            linkedInUrl: null,
            TestimonialTranslation: [
              { appLanguageId: "lang-en", quote: "Superb" },
            ],
          },
        ]),
      },
      project: {
        findFirst: jest.fn().mockResolvedValue({
          id: "pr-1",
          slug: "eleven",
          image: "https://cdn.example/p.png",
          type: "FRONTEND",
          kind: "PERSONAL",
          githubUrl: null,
          websiteUrl: null,
          isPrivate: false,
          ProjectTranslation: [
            {
              title: "Eleven",
              description: "App",
              hook: "Hook",
              challenge: "Hard",
              approach: "Ship",
              outcome: "Won",
            },
          ],
          ProjectSkill: [
            {
              Skill: {
                id: "sk-1",
                title: "React",
                SkillTranslation: [{ description: "UI" }],
              },
            },
          ],
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            slug: "eleven",
            ProjectTranslation: [{ title: "Eleven" }],
          },
          {
            slug: "atlas",
            ProjectTranslation: [{ title: "Atlas" }],
          },
        ]),
      },
    };
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db }),
    );

    const timeline = await caller.getTimelinePublic({ locale: "en" });
    expect(timeline[0]?.title).toContain("Engineer");

    const compact = await caller.getTimeline({ locale: "en" });
    expect(compact[0]).toMatchObject({ id: "tl-1" });

    const services = await caller.getServicesPublic({ locale: "en" });
    expect(services[0]?.title).toBe("Web apps");

    const about = await caller.getAboutPublic({ locale: "en" });
    expect(about?.paragraphs).toEqual(["Hello", "World"]);
    expect(about?.hasTerminal).toBe(true);

    const soft = await caller.getSoftSkillsPublic({ locale: "en" });
    expect(soft.items[0]?.title).toBe("Teamwork");

    const experiences = await caller.getExperiencesPublic({ locale: "en" });
    expect(experiences[0]?.role).toBe("Engineer");

    const testimonials = await caller.getTestimonialsPublic({ locale: "en" });
    expect(testimonials[0]?.quote).toBe("Superb");

    const project = await caller.getProjectBySlug({
      slug: "eleven",
      locale: "en",
    });
    expect(project?.title).toBe("Eleven");

    const next = await caller.getNextCaseStudyProject({
      slug: "eleven",
      locale: "en",
    });
    expect(next).toEqual({ slug: "atlas", title: "Atlas" });
  });
});
