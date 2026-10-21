import type { Company } from "@prisma/client";

export interface CompanyEditorDTO {
  id: string;
  name: string;
  email: string;
  website: string;
  linkedinUrl: string;
  location: string;
  description: string;
}

export type CompanyCreateFormDTO = Omit<CompanyEditorDTO, "id">;

export function mapCompanyToEditorDto(company: Company): CompanyEditorDTO {
  return {
    id: company.id,
    name: company.name,
    email: company.email ?? "",
    website: company.website ?? "",
    linkedinUrl: company.linkedinUrl ?? "",
    location: company.location ?? "",
    description: company.description ?? "",
  };
}

export function mapCompaniesToEditorDto(
  companies: Company[],
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
