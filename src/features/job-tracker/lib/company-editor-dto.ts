import type { Company } from "@prisma/client";

export interface CompanyEditorDTO {
  id: string;
  name: string;
  email: string;
  website: string;
  linkedinUrl: string;
  location: string;
  description: string;
  applicationsCount?: number;
}

export type CompanyCreateFormDTO = Omit<
  CompanyEditorDTO,
  "id" | "applicationsCount"
>;

export type CompanyWithApplicationCount = Company & {
  _count?: { applications?: number };
};

export function mapCompanyToEditorDto(
  company: CompanyWithApplicationCount,
): CompanyEditorDTO {
  return {
    id: company.id,
    name: company.name,
    email: company.email ?? "",
    website: company.website ?? "",
    linkedinUrl: company.linkedinUrl ?? "",
    location: company.location ?? "",
    description: company.description ?? "",
    applicationsCount: company._count?.applications ?? 0,
  };
}

export function mapCompaniesToEditorDto(
  companies: CompanyWithApplicationCount[],
): CompanyEditorDTO[] {
  return companies.map(mapCompanyToEditorDto);
}

export function buildEmptyCompanyCreateDto(): CompanyCreateFormDTO {
  return {
    name: "",
    email: "",
    website: "",
    linkedinUrl: "",
    location: "",
    description: "",
  };
}
