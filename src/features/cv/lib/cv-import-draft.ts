import { z } from "zod";

export const PARSER_VERSION = "v1";

export const CvImportContactDraftSchema = z.object({
  type: z.enum([
    "EMAIL",
    "PHONE",
    "LINKEDIN",
    "GITHUB",
    "WEBSITE",
    "LOCATION",
    "CALENDLY",
    "OTHER",
  ]),
  value: z.string().min(1),
});

export const CvImportExperienceDraftSchema = z.object({
  id: z.string(),
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  responsibilities: z.array(z.string()),
});

export const CvImportEducationDraftSchema = z.object({
  id: z.string(),
  institution: z.string().min(1),
  degreeName: z.string().min(1),
  location: z.string().optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
});

export const CvImportSkillDraftSchema = z.object({
  category: z.enum([
    "FRONTEND",
    "BACKEND",
    "DATABASE",
    "TOOLS",
    "MOBILE",
    "DESKTOP",
    "DEVOPS",
    "CYBERSECURITY",
    "OTHER",
  ]),
  items: z.array(z.string().min(1)),
});

export const CvImportLanguageDraftSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1),
});

export const CvImportCertificationDraftSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().optional(),
  year: z.number().int().optional(),
});

export const CvImportDraftSchema = z.object({
  detectedLocale: z.enum(["en", "es", "nl"]),
  header: z.object({
    fullName: z.string().min(1),
    degree: z.string().optional(),
    summary: z.string().optional(),
  }),
  experiences: z.array(CvImportExperienceDraftSchema),
  education: z.array(CvImportEducationDraftSchema),
  skills: z.array(CvImportSkillDraftSchema),
  languages: z.array(CvImportLanguageDraftSchema),
  contacts: z.array(CvImportContactDraftSchema),
  certifications: z.array(CvImportCertificationDraftSchema),
});

export type CvImportDraft = z.infer<typeof CvImportDraftSchema>;
export type CvImportExperienceDraft = z.infer<
  typeof CvImportExperienceDraftSchema
>;
export type CvImportEducationDraft = z.infer<
  typeof CvImportEducationDraftSchema
>;

export interface CvImportTextSection {
  heading: string;
  lines: string[];
}
