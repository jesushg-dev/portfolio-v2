import type { LocalizedCvData } from "@/components/curriculum-vitae/types";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { Locale } from "@/i18n/config";

const CONTACT_TYPE_MAP: Record<
  string,
  CvImportDraft["contacts"][number]["type"]
> = {
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  LINKEDIN: "LINKEDIN",
  GITHUB: "GITHUB",
  WEBSITE: "WEBSITE",
  LOCATION: "LOCATION",
  CALENDLY: "CALENDLY",
  OTHER: "OTHER",
};

function formatDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${month} ${date.getFullYear()}`;
}

export function mapLocalizedCvToDraft(
  data: LocalizedCvData,
  aboutMeText: string | null,
  locale: Locale,
): CvImportDraft {
  return {
    detectedLocale: locale,
    header: {
      fullName: data.header?.fullName ?? data.profile?.displayName ?? "Unknown",
      degree: data.header?.degree ?? undefined,
      summary: aboutMeText ?? undefined,
    },
    experiences: data.experiences.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      location: exp.location ?? undefined,
      companyBlurb: exp.companyBlurb,
      startDate: formatDate(exp.startDate),
      endDate: formatDate(exp.endDate),
      current: exp.current ?? undefined,
      responsibilities: exp.responsibilities.map((r) => r.text),
      atsResponsibilities: [],
    })),
    education: data.educations.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degreeName: edu.degreeName,
      location: edu.location ?? undefined,
      startYear: edu.startYear ?? undefined,
      endYear: edu.endYear ?? undefined,
    })),
    skills: data.technicalSkills.map((group) => ({
      category: group.category,
      items: group.items,
    })),
    languages: data.languages.map((lang) => ({
      name: lang.name,
      level: lang.level,
    })),
    contacts: data.contacts.map((c) => ({
      type: CONTACT_TYPE_MAP[c.type] ?? "OTHER",
      value: c.value,
    })),
    certifications: [],
  };
}
