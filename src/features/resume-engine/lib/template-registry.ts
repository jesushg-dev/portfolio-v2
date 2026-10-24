import { z } from "zod";

export interface ResumeTemplate {
  id: string;
  revision: number;
  docx: string;
  pdf: string;
  pages: number;
  contactColumns: number;
  experiencePages: number[];
  capabilities: {
    photo: boolean;
    availability: boolean;
    certifications: boolean;
    companyLogos: boolean;
  };
  maxPageCharacters: number[];
  limits: {
    summary: number;
    bullet: number;
    bulletsPerExperience: number;
    certifications: number;
    sidebarCharacters: number;
  };
}

export const RESUME_TEMPLATES = {
  v1: {
    id: "v1",
    revision: 1,
    docx: "cv-template.docx",
    pdf: "cv-template.pdf",
    pages: 1,
    contactColumns: 1,
    experiencePages: [6],
    capabilities: {
      photo: true,
      availability: true,
      certifications: true,
      companyLogos: false,
    },
    maxPageCharacters: [3600],
    limits: {
      summary: 420,
      bullet: 160,
      bulletsPerExperience: 3,
      certifications: 1,
      sidebarCharacters: 2400,
    },
  },
  v2: {
    id: "v2",
    revision: 1,
    docx: "cv-template-v2.docx",
    pdf: "cv-template-v2.pdf",
    pages: 2,
    contactColumns: 3,
    experiencePages: [2, 6],
    capabilities: {
      photo: true,
      availability: true,
      certifications: true,
      companyLogos: true,
    },
    maxPageCharacters: [3400, 5200],
    limits: {
      summary: 650,
      bullet: 260,
      bulletsPerExperience: 5,
      certifications: 2,
      sidebarCharacters: 2400,
    },
  },
} as const satisfies Record<string, ResumeTemplate>;

export type CvTemplateVersion = keyof typeof RESUME_TEMPLATES;
export const DEFAULT_CV_TEMPLATE_VERSION: CvTemplateVersion = "v2";
export const CvTemplateVersionSchema = z.enum(
  Object.keys(RESUME_TEMPLATES) as [CvTemplateVersion, ...CvTemplateVersion[]],
);
export function getResumeTemplate(id: string): ResumeTemplate {
  return RESUME_TEMPLATES[CvTemplateVersionSchema.parse(id)];
}
