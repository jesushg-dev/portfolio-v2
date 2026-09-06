import JSZip from "jszip";

import type { LanguageRef } from "@/lib/i18n/editor-rows";

import {
  certificationsCatalog,
  nowCatalog,
  processPagesCatalog,
  projectsCatalog,
  servicesCatalog,
  skillsCatalog,
  softSkillsCatalog,
  timelineCatalog,
  usesCatalog,
  type CertificationSeedRecord,
  type ProcessPageSeedRecord,
  type ProjectSeedRecord,
  type ServiceSeedRecord,
  type SkillSeedRecord,
  type TimelineItemSeedRecord,
} from "./catalog";
import {
  SEED_EXPORT_ENTITIES,
  SEED_EXPORT_FILENAMES,
} from "@/lib/seed-export/entities";
import { slugFromKey } from "./keys";
import {
  buildSkillKeyByTitle,
  serializeCertifications,
  serializeNow,
  serializeProcessPages,
  serializeProjects,
  serializeServices,
  serializeSkills,
  serializeSoftSkills,
  serializeTimeline,
  serializeUses,
  stringifySeedJson,
  type CertificationExportRow,
  type NowFocusExportRow,
  type NowSettingsExportRow,
  type ProcessPageExportRow,
  type ProjectExportRow,
  type ServiceExportRow,
  type SkillExportRow,
  type SoftSkillExportRow,
  type SoftSkillsSectionExportRow,
  type TimelineExportRow,
  type UsesItemExportRow,
  type UsesSettingsExportRow,
} from "./serialize";
import { seedJsonFilesFromData, zipSeedJsonFiles } from "./zip";

const languages: LanguageRef[] = [
  { id: "es", code: "es" },
  { id: "en", code: "en" },
  { id: "nl", code: "nl" },
];

function hydrateSkills(seeds: SkillSeedRecord[]): SkillExportRow[] {
  return seeds.map((seed) => ({
    title: seed.title,
    type: seed.type,
    image: seed.image,
    featured: seed.featured ?? false,
    SkillTranslation: seed.translations.map((translation) => ({
      appLanguageId: translation.locale,
      description: translation.description,
      urlWiki: translation.urlWiki,
    })),
  }));
}

function skillTitleByKey(key: string): string {
  return skillsCatalog.find((skill) => skill.key === key)?.title ?? key;
}

function hydrateProjects(seeds: ProjectSeedRecord[]): ProjectExportRow[] {
  return seeds.map((seed) => ({
    image: seed.image,
    type: seed.type,
    githubUrl: seed.githubUrl,
    websiteUrl: seed.websiteUrl,
    isPrivate: seed.isPrivate,
    order: seed.order ?? 999,
    kind: seed.kind ?? "PERSONAL",
    slug: seed.slug ?? slugFromKey(seed.key),
    caseStudyEnabled: seed.caseStudyEnabled ?? false,
    ProjectTranslation: seed.translations.map((translation) => ({
      appLanguageId: translation.locale,
      title: translation.title,
      description: translation.description,
      hook: translation.hook ?? null,
      challenge: translation.challenge ?? null,
      approach: translation.approach ?? null,
      outcome: translation.outcome ?? null,
    })),
    ProjectSkill: seed.skillKeys.map((key) => ({
      Skill: { title: skillTitleByKey(key) },
    })),
  }));
}

function hydrateServices(seeds: ServiceSeedRecord[]): ServiceExportRow[] {
  return seeds.map((seed) => ({
    type: seed.type,
    icon: seed.icon ?? "code",
    statsValue: seed.statsValue ?? "",
    featured: seed.featured ?? false,
    isActive: seed.isActive ?? true,
    order: seed.order ?? 0,
    image: seed.image,
    ServiceTranslation: seed.translations.map((translation) => ({
      appLanguageId: translation.locale,
      title: translation.title,
      description: translation.description,
      badge: translation.badge ?? "",
      statsLabel: translation.statsLabel ?? "",
    })),
  }));
}

function hydrateCertifications(
  seeds: CertificationSeedRecord[],
): CertificationExportRow[] {
  return seeds.map((seed) => ({
    company: seed.company,
    issuedDate: seed.issuedDate,
    url: seed.url,
    idCredential: seed.idCredential,
    image: seed.image,
    type: [seed.type],
    CertificationTranslation: seed.translations.map((translation) => ({
      appLanguageId: translation.locale,
      title: translation.title,
    })),
    CertificateSkill: seed.skillKeys.map((key) => ({
      Skill: { title: skillTitleByKey(key) },
    })),
  }));
}

function hydrateTimeline(seeds: TimelineItemSeedRecord[]): TimelineExportRow[] {
  return seeds.map((seed) => ({
    category: seed.category,
    organization: seed.organization,
    location: seed.location ?? null,
    startDate: new Date(`${seed.startDate}T00:00:00.000Z`),
    endDate: seed.endDate ? new Date(`${seed.endDate}T00:00:00.000Z`) : null,
    current: seed.current,
    images: seed.images ?? [],
    TimelineItemTranslation: (["es", "en", "nl"] as const).map((locale) => ({
      appLanguageId: locale,
      title: seed.title[locale] ?? "",
      description: seed.description[locale] ?? "",
    })),
  }));
}

function hydrateSoftSkills(): {
  section: SoftSkillsSectionExportRow;
  items: SoftSkillExportRow[];
} {
  return {
    section: softSkillsCatalog.section,
    items: softSkillsCatalog.items.map((item) => ({
      icon: item.icon,
      featured: item.featured ?? false,
      order: item.order,
      PortfolioSoftSkillTranslation: (["en", "es", "nl"] as const).map(
        (locale) => ({
          appLanguageId: locale,
          title: item.title[locale] ?? "",
          description: item.description[locale] ?? "",
          badge: item.badge?.[locale] ?? null,
        }),
      ),
    })),
  };
}

function hydrateUses(): {
  settings: UsesSettingsExportRow;
  items: UsesItemExportRow[];
} {
  const settings = usesCatalog.settings;
  return {
    settings: {
      workspaceImage: settings.workspaceImage,
      codingPreviewLight: settings.codingPreviewLight,
      codingPreviewDark: settings.codingPreviewDark,
      UsesSettingsTranslation: (["en", "es", "nl"] as const).map((locale) => ({
        appLanguageId: locale,
        codingIntro: settings.codingIntro[locale] ?? "",
        browserIntro: settings.browserIntro[locale] ?? "",
      })),
      UsesClarification: settings.clarifications.map((clarification) => ({
        order: clarification.order,
        UsesClarificationTranslation: (["en", "es", "nl"] as const).map(
          (locale) => ({
            appLanguageId: locale,
            body: clarification.body[locale] ?? "",
          }),
        ),
      })),
      UsesWorkspaceTag: (settings.workspaceTags ?? []).map((tag, index) => ({
        order: index,
        xPercent: tag.xPercent,
        yPercent: tag.yPercent,
        UsesItem: { href: tag.itemHref },
      })),
    },
    items: usesCatalog.items.map((item) => ({
      type: item.type,
      href: item.href,
      image: item.image,
      order: item.order,
      UsesItemTranslation: (["en", "es", "nl"] as const).map((locale) => ({
        appLanguageId: locale,
        title: item.title[locale] ?? "",
        description: item.description?.[locale] ?? "",
      })),
    })),
  };
}

function hydrateNow(): {
  settings: NowSettingsExportRow;
  focuses: NowFocusExportRow[];
} {
  const settings = nowCatalog.settings;
  return {
    settings: {
      timezone: settings.timezone,
      githubUsername: settings.githubUsername,
      statusEmoji: settings.statusEmoji,
      readingTitle: settings.readingTitle,
      readingAuthors: settings.readingAuthors,
      readingProgress: settings.readingProgress,
      watchedTitle: settings.watchedTitle,
      watchedRating: settings.watchedRating,
      githubRepo: settings.githubRepo,
      githubHref: settings.githubHref,
      photoUrls: settings.photoUrls,
      NowSettingsTranslation: (["en", "es", "nl"] as const).map((locale) => ({
        appLanguageId: locale,
        statusBody: settings.statusBody[locale] ?? "",
        statusRelative: settings.statusRelative[locale] ?? "",
        githubBody: settings.githubBody[locale] ?? "",
        githubRelative: settings.githubRelative[locale] ?? "",
      })),
    },
    focuses: nowCatalog.focuses.map((focus) => ({
      order: focus.order,
      NowFocusTranslation: (["en", "es", "nl"] as const).map((locale) => ({
        appLanguageId: locale,
        label: focus.label[locale] ?? "",
        body: focus.body[locale] ?? "",
      })),
    })),
  };
}

function hydrateProcessPages(
  seeds: ProcessPageSeedRecord[],
): ProcessPageExportRow[] {
  return seeds.map((seed) => ({
    slug: seed.slug,
    template: seed.template,
    isPublished: seed.isPublished,
    showInNav: seed.showInNav,
    order: seed.order,
    navIcon: seed.navIcon,
    ProcessPageTranslation: seed.translations.map((translation) => ({
      appLanguageId: translation.locale,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      menuTitle: translation.menuTitle,
      navDescription: translation.navDescription,
      pageNavLabel: translation.pageNavLabel,
      heroEyebrow: translation.heroEyebrow,
      heroTitle: translation.heroTitle,
      heroTitleHighlight: translation.heroTitleHighlight,
      heroDescription: translation.heroDescription,
      heroPrimaryCta: translation.heroPrimaryCta,
      heroSecondaryCta: translation.heroSecondaryCta,
      heroScrollHint: translation.heroScrollHint,
      ctaTitle: translation.ctaTitle,
      ctaDescription: translation.ctaDescription,
      ctaButton: translation.ctaButton,
      content: translation.content,
    })),
  }));
}

function expectedProjects(seeds: ProjectSeedRecord[]): ProjectSeedRecord[] {
  return seeds.map((seed) => ({
    ...seed,
    slug: seed.slug ?? slugFromKey(seed.key),
  }));
}

describe("seed export serializers", () => {
  it("round-trips skills including catalog keys", () => {
    const exported = serializeSkills(hydrateSkills(skillsCatalog), languages);
    expect(exported).toEqual(skillsCatalog);
  });

  it("generates a PascalCase key for skills missing from the catalog", () => {
    const exported = serializeSkills(
      hydrateSkills([
        {
          key: "ignored",
          title: "Brand New Skill",
          type: "TOOLS",
          image: "new",
          featured: false,
          translations: [
            { locale: "es", description: "n", urlWiki: "https://es.example" },
            { locale: "en", description: "n", urlWiki: "https://en.example" },
            { locale: "nl", description: "n", urlWiki: "https://nl.example" },
          ],
        },
      ]),
      languages,
    );
    expect(exported[0]?.key).toBe("BrandNewSkill");
  });

  it("round-trips projects including skillKeys", () => {
    const skillKeyByTitle = buildSkillKeyByTitle(skillsCatalog);
    const exported = serializeProjects(
      hydrateProjects(projectsCatalog),
      languages,
      skillKeyByTitle,
    );
    expect(exported).toEqual(expectedProjects(projectsCatalog));
  });

  it("round-trips services", () => {
    expect(
      serializeServices(hydrateServices(servicesCatalog), languages),
    ).toEqual(servicesCatalog);
  });

  it("round-trips certifications including empty skillKeys", () => {
    const skillKeyByTitle = buildSkillKeyByTitle(skillsCatalog);
    expect(
      serializeCertifications(
        hydrateCertifications(certificationsCatalog),
        languages,
        skillKeyByTitle,
      ),
    ).toEqual(certificationsCatalog);
  });

  it("round-trips timeline items", () => {
    expect(
      serializeTimeline(hydrateTimeline(timelineCatalog.items), languages),
    ).toEqual(timelineCatalog);
  });

  it("round-trips soft-skills section and items", () => {
    const hydrated = hydrateSoftSkills();
    expect(
      serializeSoftSkills(hydrated.section, hydrated.items, languages),
    ).toEqual(softSkillsCatalog);
  });

  it("round-trips uses settings and items", () => {
    const hydrated = hydrateUses();
    expect(serializeUses(hydrated.settings, hydrated.items, languages)).toEqual(
      usesCatalog,
    );
  });

  it("round-trips uses workspace tags by item href", () => {
    const hydrated = hydrateUses();
    const itemHref = usesCatalog.items[0]?.href ?? "";
    hydrated.settings.UsesWorkspaceTag = [
      {
        order: 0,
        xPercent: 42.5,
        yPercent: 18,
        UsesItem: { href: itemHref },
      },
    ];
    expect(
      serializeUses(hydrated.settings, hydrated.items, languages).settings
        .workspaceTags,
    ).toEqual([{ itemHref, xPercent: 42.5, yPercent: 18 }]);
  });

  it("round-trips now settings and focuses", () => {
    const hydrated = hydrateNow();
    expect(
      serializeNow(hydrated.settings, hydrated.focuses, languages),
    ).toEqual(nowCatalog);
  });

  it("round-trips process pages including catalog keys", () => {
    expect(
      serializeProcessPages(
        hydrateProcessPages(processPagesCatalog),
        languages,
      ),
    ).toEqual(processPagesCatalog);
  });

  it("generates a PascalCase key for process pages missing from the catalog", () => {
    const exported = serializeProcessPages(
      hydrateProcessPages([
        {
          key: "ignored",
          slug: "brand-new-process",
          template: "WORKFLOW",
          navIcon: "Bot",
          order: 9,
          isPublished: false,
          showInNav: false,
          translations: [
            {
              locale: "es",
              metaTitle: "",
              metaDescription: "",
              menuTitle: "",
              navDescription: "",
              pageNavLabel: "",
              heroEyebrow: "",
              heroTitle: "",
              heroTitleHighlight: "",
              heroDescription: "",
              heroPrimaryCta: "",
              heroSecondaryCta: "",
              heroScrollHint: "",
              ctaTitle: "",
              ctaDescription: "",
              ctaButton: "",
              content: { version: 2, sections: [] },
            },
            {
              locale: "en",
              metaTitle: "",
              metaDescription: "",
              menuTitle: "",
              navDescription: "",
              pageNavLabel: "",
              heroEyebrow: "",
              heroTitle: "",
              heroTitleHighlight: "",
              heroDescription: "",
              heroPrimaryCta: "",
              heroSecondaryCta: "",
              heroScrollHint: "",
              ctaTitle: "",
              ctaDescription: "",
              ctaButton: "",
              content: { version: 2, sections: [] },
            },
            {
              locale: "nl",
              metaTitle: "",
              metaDescription: "",
              menuTitle: "",
              navDescription: "",
              pageNavLabel: "",
              heroEyebrow: "",
              heroTitle: "",
              heroTitleHighlight: "",
              heroDescription: "",
              heroPrimaryCta: "",
              heroSecondaryCta: "",
              heroScrollHint: "",
              ctaTitle: "",
              ctaDescription: "",
              ctaButton: "",
              content: { version: 2, sections: [] },
            },
          ],
        },
      ]),
      languages,
    );
    expect(exported[0]?.key).toBe("BrandNewProcess");
  });

  it("pretty-prints JSON with a trailing newline", () => {
    expect(stringifySeedJson({ a: 1 })).toBe('{\n  "a": 1\n}\n');
  });
});

describe("seed export zip", () => {
  it("contains the nine seed JSON files and round-trips catalog data", async () => {
    const skillKeyByTitle = buildSkillKeyByTitle(skillsCatalog);
    const hydratedSoftSkills = hydrateSoftSkills();
    const hydratedUses = hydrateUses();
    const hydratedNow = hydrateNow();
    const data = {
      skills: serializeSkills(hydrateSkills(skillsCatalog), languages),
      projects: serializeProjects(
        hydrateProjects(projectsCatalog),
        languages,
        skillKeyByTitle,
      ),
      services: serializeServices(hydrateServices(servicesCatalog), languages),
      certifications: serializeCertifications(
        hydrateCertifications(certificationsCatalog),
        languages,
        skillKeyByTitle,
      ),
      timeline: serializeTimeline(
        hydrateTimeline(timelineCatalog.items),
        languages,
      ),
      softSkills: serializeSoftSkills(
        hydratedSoftSkills.section,
        hydratedSoftSkills.items,
        languages,
      ),
      uses: serializeUses(hydratedUses.settings, hydratedUses.items, languages),
      now: serializeNow(hydratedNow.settings, hydratedNow.focuses, languages),
      processPages: serializeProcessPages(
        hydrateProcessPages(processPagesCatalog),
        languages,
      ),
    };

    const files = seedJsonFilesFromData(data);
    const base64 = await zipSeedJsonFiles(files);
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const names = Object.keys(zip.files)
      .filter((name) => !zip.files[name]?.dir)
      .sort();

    expect(names).toEqual(
      SEED_EXPORT_ENTITIES.map(
        (entity) => SEED_EXPORT_FILENAMES[entity],
      ).sort(),
    );

    const expected = {
      skills: skillsCatalog,
      projects: expectedProjects(projectsCatalog),
      services: servicesCatalog,
      certifications: certificationsCatalog,
      timeline: timelineCatalog,
      softSkills: softSkillsCatalog,
      uses: usesCatalog,
      now: nowCatalog,
      processPages: processPagesCatalog,
    } as const;

    for (const entity of SEED_EXPORT_ENTITIES) {
      const fileName = SEED_EXPORT_FILENAMES[entity];
      const json = await zip.file(fileName)?.async("string");
      expect(json).toBe(stringifySeedJson(data[entity]));
      expect(JSON.parse(json ?? "")).toEqual(expected[entity]);
    }
  });
});
