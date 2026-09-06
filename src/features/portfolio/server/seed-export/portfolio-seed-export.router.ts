import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import {
  SEED_EXPORT_FILENAMES,
  SEED_EXPORT_ZIP_FILENAME,
} from "@/lib/seed-export/entities";
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
} from "@/features/portfolio/server/seed-export/serialize";
import {
  seedJsonFilesFromData,
  zipSeedJsonFiles,
} from "@/features/portfolio/server/seed-export/zip";

function payload(fileName: string, data: unknown) {
  return { fileName, json: stringifySeedJson(data) };
}

export const portfolioSeedExportRouter = createTRPCRouter({
  skills: protectedProcedure.query(async ({ ctx }) => {
    const [skills, languages] = await Promise.all([
      ctx.db.skill.findMany({
        where: { userId: ctx.user.id },
        include: { SkillTranslation: true },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.skills,
      serializeSkills(skills, languages),
    );
  }),

  projects: protectedProcedure.query(async ({ ctx }) => {
    const [projects, skills, languages] = await Promise.all([
      ctx.db.project.findMany({
        where: { userId: ctx.user.id },
        include: {
          ProjectTranslation: true,
          ProjectSkill: { include: { Skill: { select: { title: true } } } },
        },
      }),
      ctx.db.skill.findMany({
        where: { userId: ctx.user.id },
        select: { title: true },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    const skillKeyByTitle = buildSkillKeyByTitle(skills);
    return payload(
      SEED_EXPORT_FILENAMES.projects,
      serializeProjects(projects, languages, skillKeyByTitle),
    );
  }),

  services: protectedProcedure.query(async ({ ctx }) => {
    const [services, languages] = await Promise.all([
      ctx.db.service.findMany({
        where: { userId: ctx.user.id },
        include: { ServiceTranslation: true },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.services,
      serializeServices(services, languages),
    );
  }),

  certifications: protectedProcedure.query(async ({ ctx }) => {
    const [certifications, skills, languages] = await Promise.all([
      ctx.db.certification.findMany({
        where: { userId: ctx.user.id },
        include: {
          CertificationTranslation: true,
          CertificateSkill: {
            include: { Skill: { select: { title: true } } },
          },
        },
      }),
      ctx.db.skill.findMany({
        where: { userId: ctx.user.id },
        select: { title: true },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    const skillKeyByTitle = buildSkillKeyByTitle(skills);
    return payload(
      SEED_EXPORT_FILENAMES.certifications,
      serializeCertifications(certifications, languages, skillKeyByTitle),
    );
  }),

  timeline: protectedProcedure.query(async ({ ctx }) => {
    const [items, languages] = await Promise.all([
      ctx.db.timelineItem.findMany({
        where: { userId: ctx.user.id },
        include: { TimelineItemTranslation: true },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.timeline,
      serializeTimeline(items, languages),
    );
  }),

  softSkills: protectedProcedure.query(async ({ ctx }) => {
    const [section, items, languages] = await Promise.all([
      ctx.db.softSkillsSection.findUnique({
        where: { userId: ctx.user.id },
      }),
      ctx.db.portfolioSoftSkill.findMany({
        where: { userId: ctx.user.id },
        include: { PortfolioSoftSkillTranslation: true },
        orderBy: { order: "asc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.softSkills,
      serializeSoftSkills(section, items, languages),
    );
  }),

  uses: protectedProcedure.query(async ({ ctx }) => {
    const [settings, items, languages] = await Promise.all([
      ctx.db.usesSettings.findUnique({
        where: { userId: ctx.user.id },
        include: {
          UsesSettingsTranslation: true,
          UsesClarification: {
            orderBy: { order: "asc" },
            include: { UsesClarificationTranslation: true },
          },
          UsesWorkspaceTag: {
            orderBy: { order: "asc" },
            include: { UsesItem: { select: { href: true } } },
          },
        },
      }),
      ctx.db.usesItem.findMany({
        where: { userId: ctx.user.id },
        include: { UsesItemTranslation: true },
        orderBy: [{ type: "asc" }, { order: "asc" }],
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.uses,
      serializeUses(settings, items, languages),
    );
  }),

  now: protectedProcedure.query(async ({ ctx }) => {
    const [settings, focuses, languages] = await Promise.all([
      ctx.db.nowSettings.findUnique({
        where: { userId: ctx.user.id },
        include: { NowSettingsTranslation: true },
      }),
      ctx.db.nowFocus.findMany({
        where: { userId: ctx.user.id },
        include: { NowFocusTranslation: true },
        orderBy: { order: "asc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.now,
      serializeNow(settings, focuses, languages),
    );
  }),

  processPages: protectedProcedure.query(async ({ ctx }) => {
    const [pages, languages] = await Promise.all([
      ctx.db.processPage.findMany({
        where: { userId: ctx.user.id },
        include: { ProcessPageTranslation: true },
        orderBy: { order: "asc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);
    return payload(
      SEED_EXPORT_FILENAMES.processPages,
      serializeProcessPages(pages, languages),
    );
  }),

  allZip: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const [
      languages,
      skills,
      projects,
      services,
      certifications,
      timelineItems,
      softSkillsSection,
      softSkillItems,
      usesSettings,
      usesItems,
      nowSettings,
      nowFocuses,
      processPages,
    ] = await Promise.all([
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ctx.db.skill.findMany({
        where: { userId },
        include: { SkillTranslation: true },
      }),
      ctx.db.project.findMany({
        where: { userId },
        include: {
          ProjectTranslation: true,
          ProjectSkill: { include: { Skill: { select: { title: true } } } },
        },
      }),
      ctx.db.service.findMany({
        where: { userId },
        include: { ServiceTranslation: true },
      }),
      ctx.db.certification.findMany({
        where: { userId },
        include: {
          CertificationTranslation: true,
          CertificateSkill: {
            include: { Skill: { select: { title: true } } },
          },
        },
      }),
      ctx.db.timelineItem.findMany({
        where: { userId },
        include: { TimelineItemTranslation: true },
      }),
      ctx.db.softSkillsSection.findUnique({
        where: { userId },
      }),
      ctx.db.portfolioSoftSkill.findMany({
        where: { userId },
        include: { PortfolioSoftSkillTranslation: true },
        orderBy: { order: "asc" },
      }),
      ctx.db.usesSettings.findUnique({
        where: { userId },
        include: {
          UsesSettingsTranslation: true,
          UsesClarification: {
            orderBy: { order: "asc" },
            include: { UsesClarificationTranslation: true },
          },
          UsesWorkspaceTag: {
            orderBy: { order: "asc" },
            include: { UsesItem: { select: { href: true } } },
          },
        },
      }),
      ctx.db.usesItem.findMany({
        where: { userId },
        include: { UsesItemTranslation: true },
        orderBy: [{ type: "asc" }, { order: "asc" }],
      }),
      ctx.db.nowSettings.findUnique({
        where: { userId },
        include: { NowSettingsTranslation: true },
      }),
      ctx.db.nowFocus.findMany({
        where: { userId },
        include: { NowFocusTranslation: true },
        orderBy: { order: "asc" },
      }),
      ctx.db.processPage.findMany({
        where: { userId },
        include: { ProcessPageTranslation: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const skillKeyByTitle = buildSkillKeyByTitle(skills);
    const files = seedJsonFilesFromData({
      skills: serializeSkills(skills, languages),
      projects: serializeProjects(projects, languages, skillKeyByTitle),
      services: serializeServices(services, languages),
      certifications: serializeCertifications(
        certifications,
        languages,
        skillKeyByTitle,
      ),
      timeline: serializeTimeline(timelineItems, languages),
      softSkills: serializeSoftSkills(
        softSkillsSection,
        softSkillItems,
        languages,
      ),
      uses: serializeUses(usesSettings, usesItems, languages),
      now: serializeNow(nowSettings, nowFocuses, languages),
      processPages: serializeProcessPages(processPages, languages),
    });

    return {
      fileName: SEED_EXPORT_ZIP_FILENAME,
      base64: await zipSeedJsonFiles(files),
    };
  }),
});
