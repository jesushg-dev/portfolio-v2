/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

const enCv = JSON.parse(
  readFileSync(new URL("./data/legacy-cv/en.json", import.meta.url), "utf8"),
);
const esCv = JSON.parse(
  readFileSync(new URL("./data/legacy-cv/es.json", import.meta.url), "utf8"),
);
const nlCv = JSON.parse(
  readFileSync(new URL("./data/legacy-cv/nl.json", import.meta.url), "utf8"),
);

type Locale = "en" | "es" | "nl";

interface ICurriculum {
  degree: string;
  aboutMe: string;
  clientImageAlt: string;
  contacts: Record<string, { name: string; value: string }>;
  education: Record<
    string,
    { degree: string; institution: string; location: string; dates: string }
  >;
  experiences: Record<
    string,
    {
      position: string;
      company: string;
      dates: string;
      responsibilities: string;
      skills: string;
    }
  >;
  skills: Record<string, string>;
  languages: Record<string, { name: string; level: string }>;
  softSkills: string;
  additionalInformation: string;
  personalReferences: Record<
    string,
    { name: string; role: string; phoneNumber: string }
  >;
  downloadLink?: string;
}

/**
 * Legacy CV content (snapshotted from the original messages/*.json files
 * before they were trimmed to UI-only labels).
 *
 * Kept under prisma/data/legacy-cv so the seed remains idempotent and
 * re-runnable without depending on the i18n messages catalog.
 */
const messages: Record<Locale, { curriculum: ICurriculum }> = {
  en: { curriculum: enCv },
  es: { curriculum: esCv },
  nl: { curriculum: nlCv },
};

const DEFAULT_LOCALE: Locale = "es";
const NON_DEFAULT_LOCALES: Locale[] = (["en", "es", "nl"] as Locale[]).filter(
  (l) => l !== DEFAULT_LOCALE,
);

/**
 * Builds a `LocalizedText` object from an accessor function that retrieves
 * the value for each locale, using DEFAULT_LOCALE as the `default`.
 */
const localized = (read: (locale: Locale) => string | undefined) => {
  const def = read(DEFAULT_LOCALE) ?? "";
  const translations: Partial<Record<Locale, string>> = {};
  for (const loc of NON_DEFAULT_LOCALES) {
    const v = read(loc);
    if (v?.trim()) translations[loc] = v;
  }
  return {
    default: def,
    translations:
      Object.keys(translations).length > 0 ? translations : undefined,
  };
};

/**
 * Strips <item>...</item> wrappers from the legacy messages format,
 * returning a flat list of strings.
 */
const splitItems = (raw: string | undefined): string[] => {
  if (!raw) return [];
  const matches = raw.match(/<item>([\s\S]*?)<\/item>/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/<\/?item>/g, "").trim());
};

const inferContactType = (
  key: string,
  value: string,
):
  | "EMAIL"
  | "PHONE"
  | "LINKEDIN"
  | "GITHUB"
  | "WEBSITE"
  | "LOCATION"
  | "OTHER" => {
  if (value.startsWith("mailto:") || /^[^\s@]+@[^\s@]+/.test(value))
    return "EMAIL";
  if (value.startsWith("tel:") || /^\+?\d/.test(value)) return "PHONE";
  if (/linkedin/i.test(value)) return "LINKEDIN";
  if (/github/i.test(value)) return "GITHUB";
  if (/^https?:\/\//.test(value)) return "WEBSITE";
  return "OTHER";
};

export async function seedOwner(prisma: PrismaClient): Promise<string> {
  console.log("[seed-owner] creating primary owner...");

  const email = "jess232016@gmail.com";

  // Better Auth manages User creation, but during seed we create directly.
  const owner = await prisma.user.upsert({
    where: { email },
    update: { name: "Jesús Enmanuel Hernández González" },
    create: {
      name: "Jesús Enmanuel Hernández González",
      email,
      emailVerified: true,
    },
  });

  // Make sure no other Profile is marked primary, then upsert ours.
  await prisma.profile.updateMany({
    where: { isPrimary: true, userId: { not: owner.id } },
    data: { isPrimary: false },
  });

  await prisma.profile.upsert({
    where: { userId: owner.id },
    update: {
      isPrimary: true,
      isPublished: true,
      username: "jesus",
      defaultLocale: DEFAULT_LOCALE,
      cvPdfUrl: messages[DEFAULT_LOCALE].curriculum
        ? "https://drive.google.com/uc?id=1rp2NFGTcvI-aQLczfcf3e9LZGnaVmvUY&export=download"
        : null,
      displayName: "Jesús Hernández",
    },
    create: {
      userId: owner.id,
      username: "jesus",
      displayName: "Jesús Hernández",
      defaultLocale: DEFAULT_LOCALE,
      isPrimary: true,
      isPublished: true,
      cvPdfUrl:
        "https://drive.google.com/uc?id=1rp2NFGTcvI-aQLczfcf3e9LZGnaVmvUY&export=download",
    },
  });

  // Reassign existing portfolio data to the owner (idempotent).
  await prisma.project.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });
  await prisma.skill.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });
  await prisma.service.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });
  await prisma.certification.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });

  // ---------- CV Header ----------
  await prisma.cvHeader.upsert({
    where: { userId: owner.id },
    update: {
      fullName: "Jesús Enmanuel Hernández González",
      degree: localized((l) => messages[l].curriculum.degree) as any,
      photoUrl:
        "https://res.cloudinary.com/js-media/image/upload/f_auto,q_auto/v1/portfolio/carnet/s6ipqdnq2farzggipn78",
      clientImageAlt: localized(
        (l) => messages[l].curriculum.clientImageAlt,
      ) as any,
    },
    create: {
      userId: owner.id,
      fullName: "Jesús Enmanuel Hernández González",
      degree: localized((l) => messages[l].curriculum.degree) as any,
      photoUrl:
        "https://res.cloudinary.com/js-media/image/upload/f_auto,q_auto/v1/portfolio/carnet/s6ipqdnq2farzggipn78",
      clientImageAlt: localized(
        (l) => messages[l].curriculum.clientImageAlt,
      ) as any,
    },
  });

  // ---------- About me ----------
  await prisma.cvAboutMe.upsert({
    where: { userId: owner.id },
    update: {
      aboutMe: localized((l) => messages[l].curriculum.aboutMe) as any,
    },
    create: {
      userId: owner.id,
      aboutMe: localized((l) => messages[l].curriculum.aboutMe) as any,
    },
  });

  // ---------- Contacts (delete & recreate for determinism) ----------
  await prisma.cvContact.deleteMany({ where: { userId: owner.id } });
  const contactKeys = Object.keys(messages[DEFAULT_LOCALE].curriculum.contacts);
  for (let i = 0; i < contactKeys.length; i++) {
    const key = contactKeys[i];
    const baseValue = messages[DEFAULT_LOCALE].curriculum.contacts[key].value;
    const type = inferContactType(key, baseValue);
    await prisma.cvContact.create({
      data: {
        userId: owner.id,
        type,
        value: baseValue,
        label: localized(
          (l) => messages[l].curriculum.contacts[key]?.name,
        ) as any,
        order: i,
      },
    });
  }

  // ---------- Education ----------
  await prisma.cvEducation.deleteMany({ where: { userId: owner.id } });
  const eduKeys = Object.keys(messages[DEFAULT_LOCALE].curriculum.education);
  for (let i = 0; i < eduKeys.length; i++) {
    const key = eduKeys[i];
    const base = messages[DEFAULT_LOCALE].curriculum.education[key];
    await prisma.cvEducation.create({
      data: {
        userId: owner.id,
        institution: base.institution,
        degreeName: localized(
          (l) => messages[l].curriculum.education[key]?.degree,
        ) as any,
        location: localized(
          (l) => messages[l].curriculum.education[key]?.location,
        ) as any,
        dates: base.dates,
        order: i,
      },
    });
  }

  // ---------- Languages ----------
  await prisma.cvLanguage.deleteMany({ where: { userId: owner.id } });
  const langKeys = Object.keys(messages[DEFAULT_LOCALE].curriculum.languages);
  for (let i = 0; i < langKeys.length; i++) {
    const key = langKeys[i];
    await prisma.cvLanguage.create({
      data: {
        userId: owner.id,
        name: localized(
          (l) => messages[l].curriculum.languages[key]?.name,
        ) as any,
        level: localized(
          (l) => messages[l].curriculum.languages[key]?.level,
        ) as any,
        order: i,
      },
    });
  }

  // ---------- Technical skills (no i18n needed - tech names are universal) ----------
  await prisma.cvTechnicalSkill.deleteMany({ where: { userId: owner.id } });
  const skillSections = [
    { key: "frontEnd", category: "FRONTEND" as const },
    { key: "backEnd", category: "BACKEND" as const },
    { key: "database", category: "DATABASE" as const },
    { key: "tools", category: "TOOLS" as const },
  ];
  for (let i = 0; i < skillSections.length; i++) {
    const { key, category } = skillSections[i];
    const items = splitItems(messages[DEFAULT_LOCALE].curriculum.skills?.[key]);
    if (items.length === 0) continue;
    await prisma.cvTechnicalSkill.create({
      data: {
        userId: owner.id,
        category,
        items,
        order: i,
      },
    });
  }

  // ---------- Experiences + Responsibilities ----------
  await prisma.cvExperience.deleteMany({ where: { userId: owner.id } });
  const expKeys = Object.keys(messages[DEFAULT_LOCALE].curriculum.experiences);
  for (let i = 0; i < expKeys.length; i++) {
    const key = expKeys[i];
    const base = messages[DEFAULT_LOCALE].curriculum.experiences[key];

    const responsibilities = splitItems(base.responsibilities).map(
      (textEs, idx) => ({
        text: localized((l) => {
          const items = splitItems(
            messages[l].curriculum.experiences[key]?.responsibilities,
          );
          return items[idx] ?? textEs;
        }) as any,
        order: idx,
      }),
    );

    await prisma.cvExperience.create({
      data: {
        userId: owner.id,
        company: base.company,
        role: localized(
          (l) => messages[l].curriculum.experiences[key]?.position,
        ) as any,
        dates: base.dates,
        skills: null,
        order: i,
        responsibilities: {
          createMany: {
            data: responsibilities,
          },
        },
      },
    });

    const createdExperience = await prisma.cvExperience.findFirst({
      where: { userId: owner.id, company: base.company, order: i },
      orderBy: { createdAt: "desc" },
    });

    if (createdExperience && base.skills) {
      const skillTitles = base.skills
        .split(",")
        .map((title) => title.trim())
        .filter(Boolean);
      if (skillTitles.length > 0) {
        const matchedSkills = await prisma.skill.findMany({
          where: { title: { in: skillTitles } },
          select: { id: true, title: true },
        });
        const titleToId = new Map(
          matchedSkills.map((skill) => [skill.title.toLowerCase(), skill.id]),
        );
        const skillIds = skillTitles
          .map((title) => titleToId.get(title.toLowerCase()))
          .filter((id): id is string => !!id);
        if (skillIds.length > 0) {
          await prisma.cvExperienceSkill.createMany({
            data: skillIds.map((skillId) => ({
              experienceId: createdExperience.id,
              skillId,
            })),
          });
        }
      }
    }
  }

  // ---------- Soft skills ----------
  await prisma.cvSoftSkill.deleteMany({ where: { userId: owner.id } });
  const softSkillsBase = splitItems(
    messages[DEFAULT_LOCALE].curriculum.softSkills,
  );
  for (let idx = 0; idx < softSkillsBase.length; idx++) {
    await prisma.cvSoftSkill.create({
      data: {
        userId: owner.id,
        name: localized((l) => {
          const items = splitItems(messages[l].curriculum.softSkills);
          return items[idx] ?? softSkillsBase[idx];
        }) as any,
        order: idx,
      },
    });
  }

  // ---------- Additional info ----------
  await prisma.cvAdditionalInfo.deleteMany({ where: { userId: owner.id } });
  const additionalBase = splitItems(
    messages[DEFAULT_LOCALE].curriculum.additionalInformation,
  );
  for (let idx = 0; idx < additionalBase.length; idx++) {
    await prisma.cvAdditionalInfo.create({
      data: {
        userId: owner.id,
        text: localized((l) => {
          const items = splitItems(
            messages[l].curriculum.additionalInformation,
          );
          return items[idx] ?? additionalBase[idx];
        }) as any,
        order: idx,
      },
    });
  }

  // ---------- Personal references ----------
  await prisma.cvPersonalReference.deleteMany({ where: { userId: owner.id } });
  const refKeys = Object.keys(
    messages[DEFAULT_LOCALE].curriculum.personalReferences,
  );
  for (let i = 0; i < refKeys.length; i++) {
    const key = refKeys[i];
    const base = messages[DEFAULT_LOCALE].curriculum.personalReferences[key];
    await prisma.cvPersonalReference.create({
      data: {
        userId: owner.id,
        name: base.name,
        role: localized(
          (l) => messages[l].curriculum.personalReferences[key]?.role,
        ) as any,
        contact: base.phoneNumber,
        order: i,
      },
    });
  }

  console.log(`[seed-owner] done. owner.id=${owner.id}`);
  return owner.id;
}
