import type { LocalizedCvData } from "@/components/curriculum-vitae/types";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";

function parseDraftDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-01-01T00:00:00.000Z`);
  }
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}-01T00:00:00.000Z`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapDraftToLocalizedCv(draft: CvImportDraft): {
  data: LocalizedCvData;
  aboutMeText: string | null;
} {
  const summary = draft.header.summary?.trim();
  const aboutMeText = summary != null && summary.length > 0 ? summary : null;

  const data: LocalizedCvData = {
    header: {
      id: "draft-header",
      fullName: draft.header.fullName,
      photoUrl: null,
      backgroundImageUrl: null,
      degree: draft.header.degree ?? "",
      clientImageAlt: draft.header.fullName,
    },
    profile: {
      displayName: draft.header.fullName,
      username: null,
    },
    contacts: draft.contacts.map((contact, index) => ({
      id: `contact-${index}`,
      type: contact.type,
      value: contact.value,
      order: index,
      label: contact.type,
    })),
    educations: draft.education.map((edu, index) => ({
      id: edu.id || `edu-${index}`,
      institution: edu.institution,
      startYear: edu.startYear ?? null,
      endYear: edu.endYear ?? null,
      dates: edu.dates ?? null,
      order: index,
      degreeName: edu.degreeName,
      location: edu.location ?? "",
    })),
    languages: draft.languages.map((lang, index) => ({
      id: `lang-${index}`,
      order: index,
      name: lang.name,
      level: lang.level,
    })),
    technicalSkills: draft.skills.map((group, index) => ({
      id: `skill-${index}`,
      category: group.category,
      items: group.items,
      order: index,
    })),
    experiences: draft.experiences.map((exp, index) => ({
      id: exp.id || `exp-${index}`,
      company: exp.company,
      companyLogoUrl: null,
      startDate: parseDraftDate(exp.startDate),
      endDate: parseDraftDate(exp.endDate),
      current: exp.current ?? false,
      order: index,
      role: exp.role,
      location: exp.location ?? "",
      companyBlurb: exp.companyBlurb,
      responsibilities: exp.responsibilities.map((text, respIndex) => ({
        id: `${exp.id}-resp-${respIndex}`,
        order: respIndex,
        text,
      })),
      skills: [],
    })),
    softSkills: [],
    additionalInformation: [],
    personalReferences: [],
    certifications: draft.certifications.map((cert, index) => ({
      id: `cert-${index}`,
      title: cert.title,
      issuer: cert.issuer,
      year: cert.year,
    })),
  };

  return { data, aboutMeText };
}
