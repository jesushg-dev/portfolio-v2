import type { PrismaClient } from "@prisma/client";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";

async function persistImportedCertifications(
  db: PrismaClient,
  userId: string,
  draft: CvImportDraft,
  appLanguageId?: string,
): Promise<void> {
  if (draft.certifications.length === 0) return;

  const existing = await db.certification.findMany({
    where: { userId },
    include: { CertificationTranslation: true },
  });

  for (const cert of draft.certifications) {
    const titleKey = cert.title.trim().toLowerCase();
    const issuerKey = (cert.issuer ?? "").trim().toLowerCase();
    const alreadyImported = existing.some((row) => {
      const sameIssuer = row.company.trim().toLowerCase() === issuerKey;
      const sameTitle = row.CertificationTranslation.some(
        (translation) => translation.title.trim().toLowerCase() === titleKey,
      );
      return sameTitle && (issuerKey.length === 0 || sameIssuer);
    });
    if (alreadyImported) continue;

    await db.certification.create({
      data: {
        userId,
        company: cert.issuer?.trim() ? cert.issuer.trim() : "Unknown",
        issuedDate: cert.year,
        CertificationTranslation: appLanguageId
          ? {
              create: [
                {
                  appLanguageId,
                  title: cert.title.trim(),
                },
              ],
            }
          : undefined,
      },
    });
  }
}

function parseExperienceDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-01-01`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function persistCvImportDraft(
  db: PrismaClient,
  userId: string,
  draft: CvImportDraft,
): Promise<void> {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  const locale = draft.detectedLocale;
  const appLang = languages.find((l) => l.code === locale) ?? languages[0];

  const header = await db.cvHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: draft.header.fullName,
    },
    update: {
      fullName: draft.header.fullName,
    },
  });

  if (appLang) {
    const existingHeaderTrans = await db.cvHeaderTranslation.findFirst({
      where: { cvHeaderId: header.id, appLanguageId: appLang.id },
    });
    if (existingHeaderTrans) {
      await db.cvHeaderTranslation.update({
        where: { id: existingHeaderTrans.id },
        data: {
          degree: draft.header.degree ?? "",
          heroSummary: draft.header.summary ?? null,
        },
      });
    } else {
      await db.cvHeaderTranslation.create({
        data: {
          cvHeaderId: header.id,
          appLanguageId: appLang.id,
          degree: draft.header.degree ?? "",
          heroSummary: draft.header.summary ?? null,
        },
      });
    }
  }

  if (draft.header.summary) {
    const about = await db.cvAboutMe.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    if (appLang) {
      const existingAboutTrans = await db.cvAboutMeTranslation.findFirst({
        where: { cvAboutMeId: about.id, appLanguageId: appLang.id },
      });
      if (existingAboutTrans) {
        await db.cvAboutMeTranslation.update({
          where: { id: existingAboutTrans.id },
          data: { aboutMe: draft.header.summary },
        });
      } else {
        await db.cvAboutMeTranslation.create({
          data: {
            cvAboutMeId: about.id,
            appLanguageId: appLang.id,
            aboutMe: draft.header.summary,
          },
        });
      }
    }
  }

  const existingContacts = await db.cvContact.count({ where: { userId } });
  for (const [index, contact] of draft.contacts.entries()) {
    await db.cvContact.create({
      data: {
        userId,
        type: contact.type,
        value: contact.value,
        order: existingContacts + index,
      },
    });
  }

  const existingEducation = await db.cvEducation.count({ where: { userId } });
  for (const [index, edu] of draft.education.entries()) {
    await db.cvEducation.create({
      data: {
        userId,
        institution: edu.institution,
        startYear: edu.startYear,
        endYear: edu.endYear,
        order: existingEducation + index,
        translations: appLang
          ? {
              create: [
                {
                  appLanguageId: appLang.id,
                  degreeName: edu.degreeName,
                  location: edu.location ?? null,
                },
              ],
            }
          : undefined,
      },
    });
  }

  const existingLanguages = await db.cvLanguage.count({ where: { userId } });
  for (const [index, lang] of draft.languages.entries()) {
    await db.cvLanguage.create({
      data: {
        userId,
        order: existingLanguages + index,
        translations: appLang
          ? {
              create: [
                {
                  appLanguageId: appLang.id,
                  name: lang.name,
                  level: lang.level,
                },
              ],
            }
          : undefined,
      },
    });
  }

  const existingSkills = await db.cvTechnicalSkill.count({ where: { userId } });
  for (const [index, skillGroup] of draft.skills.entries()) {
    await db.cvTechnicalSkill.create({
      data: {
        userId,
        category: skillGroup.category,
        items: skillGroup.items,
        order: existingSkills + index,
      },
    });
  }

  const existingExperiences = await db.cvExperience.count({
    where: { userId },
  });
  for (const [index, exp] of draft.experiences.entries()) {
    await db.cvExperience.create({
      data: {
        userId,
        company: exp.company,
        startDate: parseExperienceDate(exp.startDate),
        endDate: parseExperienceDate(exp.endDate),
        current: exp.current ?? false,
        order: existingExperiences + index,
        translations: appLang
          ? {
              create: [
                {
                  appLanguageId: appLang.id,
                  role: exp.role,
                  location: exp.location ?? null,
                },
              ],
            }
          : undefined,
        responsibilities: {
          create: exp.responsibilities.map((text, respIndex) => ({
            order: respIndex,
            translations: appLang
              ? {
                  create: [
                    {
                      appLanguageId: appLang.id,
                      text,
                    },
                  ],
                }
              : undefined,
          })),
        },
      },
    });
  }

  await persistImportedCertifications(db, userId, draft, appLang?.id);
}
