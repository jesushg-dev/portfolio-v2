import type { Application, ApplicationEvent, Company } from "@prisma/client";
import type { CompanyEditorDTO } from "@/features/job-tracker/lib/company-editor-dto";
import { mapCompanyToEditorDto } from "@/features/job-tracker/lib/company-editor-dto";
import { computeLastActivityAt } from "@/features/job-tracker/lib/stale-application";

export type ApplicationStatus =
  "APPLIED" | "INTERVIEW" | "OFFER" | "GHOSTED" | "REJECTED" | "HIRED";

export interface ApplicationCvFileDTO {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface ApplicationEditorDTO {
  id: string;
  position: string;
  description: string;
  companyId: string;
  status: ApplicationStatus;
  appliedDate: Date;
  salary: string;
  location: string;
  notes: string;
  cvFile?: ApplicationCvFileDTO;
}

export type ApplicationCreateFormDTO = Omit<ApplicationEditorDTO, "id">;

export interface ApplicationListRowDTO extends ApplicationEditorDTO {
  company: CompanyEditorDTO;
  updatedAt: Date;
  lastActivityAt: Date;
  ghostNudgeSnoozedUntil: Date | null;
}

export interface ApplicationDetailDTO extends ApplicationListRowDTO {
  events: ApplicationEvent[];
  coverLetterSubject: string;
  coverLetterBody: string;
}

type ApplicationWithCompany = Application & {
  company: Company;
  events?: Pick<ApplicationEvent, "scheduledDate" | "completedAt">[];
};

type ApplicationWithCompanyAndEvents = ApplicationWithCompany & {
  events: ApplicationEvent[];
};

export const applicationListInclude = {
  company: true,
  events: {
    select: { scheduledDate: true, completedAt: true },
  },
} as const;

export function mapApplicationToEditorDto(
  application: Application,
): ApplicationEditorDTO {
  return {
    id: application.id,
    position: application.position,
    description: application.description ?? "",
    companyId: application.companyId,
    status: application.status as ApplicationStatus,
    appliedDate: application.appliedDate,
    salary: application.salary ?? "",
    location: application.location ?? "",
    notes: application.notes ?? "",
    cvFile: application.cvFile
      ? {
          name: application.cvFile.name,
          url: application.cvFile.url,
          uploadedAt: application.cvFile.uploadedAt,
        }
      : undefined,
  };
}

export function mapApplicationToListDto(
  application: ApplicationWithCompany,
): ApplicationListRowDTO {
  return {
    ...mapApplicationToEditorDto(application),
    company: mapCompanyToEditorDto(application.company),
    updatedAt: application.updatedAt,
    lastActivityAt: computeLastActivityAt(
      application.appliedDate,
      application.events ?? [],
    ),
    ghostNudgeSnoozedUntil: application.ghostNudgeSnoozedUntil ?? null,
  };
}

export function mapApplicationsToListDto(
  applications: ApplicationWithCompany[],
): ApplicationListRowDTO[] {
  return applications.map(mapApplicationToListDto);
}

export function mapApplicationToDetailDto(
  application: ApplicationWithCompanyAndEvents,
): ApplicationDetailDTO {
  return {
    ...mapApplicationToListDto(application),
    events: application.events,
    coverLetterSubject: application.coverLetterSubject ?? "",
    coverLetterBody: application.coverLetterBody ?? "",
  };
}

export function buildEmptyApplicationCreateDto(): ApplicationCreateFormDTO {
  return {
    position: "",
    description: "",
    companyId: "",
    status: "APPLIED",
    appliedDate: new Date(),
    salary: "",
    location: "",
    notes: "",
  };
}
