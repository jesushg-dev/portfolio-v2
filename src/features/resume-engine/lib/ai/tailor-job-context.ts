import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";

export interface TailorJobContext {
  position?: string | null;
  companyName?: string | null;
  companyDescription?: string | null;
  location?: string | null;
  salary?: string | null;
  notes?: string | null;
  softSkills?: string[];
  additionalInfo?: string[];
}

function resolveLocale(value: string | undefined): Locale {
  if (value === "es" || value === "nl") return value;
  return "en";
}

function orNone(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "(none)";
}

/** Formats optional job/application extras for tailor (and related) user prompts. */
export function formatTailorJobContext(
  context?: TailorJobContext | null,
): string {
  if (!context) return "";

  const softSkills = context.softSkills?.filter((s) => s.trim()) ?? [];
  const additionalInfo = context.additionalInfo?.filter((s) => s.trim()) ?? [];

  const hasAny =
    Boolean(context.position?.trim()) ||
    Boolean(context.companyName?.trim()) ||
    Boolean(context.companyDescription?.trim()) ||
    Boolean(context.location?.trim()) ||
    Boolean(context.salary?.trim()) ||
    Boolean(context.notes?.trim()) ||
    softSkills.length > 0 ||
    additionalInfo.length > 0;

  if (!hasAny) return "";

  return `
APPLICATION CONTEXT (use for emphasis and tone; do not invent experience, metrics, or skills from this block):
- position: ${orNone(context.position)}
- company: ${orNone(context.companyName)}
- companyDescription: ${orNone(context.companyDescription)}
- location: ${orNone(context.location)}
- salary: ${orNone(context.salary)}
- notes: ${orNone(context.notes)}
- softSkills: ${softSkills.length > 0 ? softSkills.join(", ") : "(none)"}
- additionalInfo: ${additionalInfo.length > 0 ? additionalInfo.join(" · ") : "(none)"}
`.trim();
}

export async function loadTailorJobContext(
  db: PrismaClient,
  userId: string,
  applicationId: string | undefined,
  locale: Locale = "en",
): Promise<TailorJobContext | null> {
  const [application, softSkills, additionalInfo, profile, appLanguages] =
    await Promise.all([
      applicationId
        ? db.application.findFirst({
            where: { id: applicationId, userId },
            include: { company: true },
          })
        : Promise.resolve(null),
      db.cvSoftSkill.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvAdditionalInfo.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.profile.findUnique({
        where: { userId },
        select: { defaultLocale: true },
      }),
      db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);

  const activeLocale = resolveLocale(locale || profile?.defaultLocale);
  const field = createLocalizedFieldResolver(appLanguages, activeLocale);

  const softSkillNames = softSkills
    .map((skill) => field(skill.translations, "name").trim())
    .filter(Boolean);

  const additionalInfoTexts = additionalInfo
    .map((row) => field(row.translations, "text").trim())
    .filter(Boolean);

  if (
    !application &&
    softSkillNames.length === 0 &&
    additionalInfoTexts.length === 0
  ) {
    return null;
  }

  return {
    position: application?.position ?? null,
    companyName: application?.company.name ?? null,
    companyDescription: application?.company.description ?? null,
    location: application?.location ?? null,
    salary: application?.salary ?? null,
    notes: application?.notes ?? null,
    softSkills: softSkillNames,
    additionalInfo: additionalInfoTexts,
  };
}
