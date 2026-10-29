import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import {
  assertNonEmptyUserId,
  requireAuthenticatedUserId,
} from "@/lib/admin/get-authenticated-user-id";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import { extractStringFilter } from "@/lib/admin/filter-utils";
import {
  buildEmptyApplicationCreateDto,
  mapApplicationToDetailDto,
  mapApplicationToEditorDto,
  mapApplicationsToListDto,
  applicationListInclude,
  type ApplicationStatus,
} from "@/features/job-tracker/lib/application-editor-dto";
import { buildEmptyEventCreateDto } from "@/features/job-tracker/lib/event-editor-dto";
import {
  buildEmptyCompanyCreateDto,
  mapCompaniesToEditorDto,
  mapCompanyToEditorDto,
  type CompanyEditorDTO,
} from "@/features/job-tracker/lib/company-editor-dto";
import { pullLinkedUpcomingEventsFromGoogle } from "@/lib/google-calendar/sync";
import { parseMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { readResumeSnapshot } from "@/features/resume-engine/lib/tailored-resume-document";
import { getOpenJobSearch } from "@/features/job-tracker/server/active-job-search";
import { addBusinessDays } from "@/features/job-tracker/lib/application-next-step";
import type { EventType } from "@/features/job-tracker/types";

const UPCOMING_EVENTS_LIMIT = 20;

export interface DashboardStatsDTO {
  totalApplications: number;
  totalCompanies: number;
  applied: number;
  inProgress: number;
  offers: number;
  ghosted: number;
  rejected: number;
  hired: number;
}

export interface UpcomingEventDTO {
  id: string;
  type: string;
  title: string;
  description: string | null;
  scheduledDate: Date;
  duration: number | null;
  location: string | null;
  isVirtual: boolean | null;
  meetingLink: string | null;
  application: {
    id: string;
    position: string;
    company: { name: string };
  };
}

function buildApplicationWhere(
  userId: string,
  filters?: DataTableParams["filters"],
): Prisma.ApplicationWhereInput {
  assertNonEmptyUserId(userId);
  const where: Prisma.ApplicationWhereInput = { userId };

  const positionVal = extractStringFilter(filters, "position");
  if (positionVal) {
    where.position = { contains: positionVal, mode: "insensitive" };
  }

  const companyVal = extractStringFilter(filters, "company");
  if (companyVal) {
    where.company = {
      name: { contains: companyVal, mode: "insensitive" },
    };
  }

  const statusVal = extractStringFilter(filters, "status");
  if (statusVal) {
    where.status = statusVal;
  }

  return where;
}

function buildCompanyWhere(
  userId: string,
  filters?: DataTableParams["filters"],
): Prisma.CompanyWhereInput {
  assertNonEmptyUserId(userId);
  const where: Prisma.CompanyWhereInput = { userId };

  const nameVal = extractStringFilter(filters, "name");
  if (nameVal) {
    where.name = { contains: nameVal, mode: "insensitive" };
  }

  const emailVal = extractStringFilter(filters, "email");
  if (emailVal) {
    where.email = { contains: emailVal, mode: "insensitive" };
  }

  return where;
}

function buildApplicationOrderBy(
  sort?: DataTableParams["sort"],
): Prisma.ApplicationOrderByWithRelationInput {
  if (sort && sort.length > 0) {
    const sortField = sort[0];
    if (sortField.id === "position") {
      return { position: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "appliedDate") {
      return { appliedDate: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "status") {
      return { status: sortField.desc ? "desc" : "asc" };
    }
  }
  return { appliedDate: "desc" };
}

function buildCompanyOrderBy(
  sort?: DataTableParams["sort"],
): Prisma.CompanyOrderByWithRelationInput {
  if (sort && sort.length > 0) {
    const sortField = sort[0];
    if (sortField.id === "name") {
      return { name: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "createdAt") {
      return { createdAt: sortField.desc ? "desc" : "asc" };
    }
  }
  return { createdAt: "desc" };
}

export async function getDashboardStatsData(): Promise<DashboardStatsDTO> {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  const where = search
    ? { userId, jobSearchId: search.id }
    : { id: { in: [] } };

  const [totalApplications, totalCompanies, statusCounts] = await Promise.all([
    db.application.count({ where }),
    db.company.count({ where: { userId } }),
    db.application.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
  ]);

  const countByStatus = (status: ApplicationStatus) =>
    statusCounts.find((s) => s.status === status)?._count ?? 0;

  return {
    totalApplications,
    totalCompanies,
    applied: countByStatus("APPLIED"),
    inProgress: countByStatus("INTERVIEW"),
    offers: countByStatus("OFFER"),
    ghosted: countByStatus("GHOSTED"),
    rejected: countByStatus("REJECTED"),
    hired: countByStatus("HIRED"),
  };
}

export async function getUpcomingEventsData(
  limit = UPCOMING_EVENTS_LIMIT,
): Promise<UpcomingEventDTO[]> {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  if (!search) return [];

  const events = await db.applicationEvent.findMany({
    where: {
      userId,
      application: { is: { jobSearchId: search.id } },
      completed: false,
      scheduledDate: { gt: new Date() },
    },
    include: {
      application: {
        include: { company: true },
      },
    },
    orderBy: { scheduledDate: "asc" },
    take: limit,
  });

  const pulled = await pullLinkedUpcomingEventsFromGoogle(
    userId,
    events.map((event) => ({
      id: event.id,
      title: event.title,
      googleEventId: event.googleEventId,
      googleEtag: event.googleEtag,
      scheduledDate: event.scheduledDate,
      duration: event.duration,
      location: event.location,
      meetingLink: event.meetingLink,
    })),
  );

  const pulledById = new Map(pulled.map((event) => [event.id, event]));

  return events.map((event) => {
    const synced = pulledById.get(event.id);
    return {
      id: event.id,
      type: event.type,
      title: synced?.title ?? event.title,
      description: event.description,
      scheduledDate: synced?.scheduledDate ?? event.scheduledDate,
      duration: synced?.duration ?? event.duration,
      location: synced?.location ?? event.location,
      isVirtual: event.isVirtual,
      meetingLink: synced?.meetingLink ?? event.meetingLink,
      application: {
        id: event.application.id,
        position: event.application.position,
        company: { name: event.application.company.name },
      },
    };
  });
}

export async function getApplicationsListData(params: DataTableParams) {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  if (!search) return { data: [], pageCount: 1, totalCount: 0 };
  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  const where = buildApplicationWhere(userId, params.filters);
  where.jobSearchId = search.id;
  const orderBy = buildApplicationOrderBy(params.sort);

  const [applications, totalCount] = await Promise.all([
    db.application.findMany({
      where,
      include: applicationListInclude,
      orderBy,
      skip,
      take,
    }),
    db.application.count({ where }),
  ]);

  return {
    data: mapApplicationsToListDto(applications),
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}

export async function getCompaniesListData(params: DataTableParams) {
  const userId = await requireAuthenticatedUserId();
  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  const where = buildCompanyWhere(userId, params.filters);
  const orderBy = buildCompanyOrderBy(params.sort);

  const [companies, totalCount] = await Promise.all([
    db.company.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
    db.company.count({ where }),
  ]);

  return {
    data: mapCompaniesToEditorDto(companies),
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}

export async function getJobTrackerPageData(params: DataTableParams) {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  const [upcomingEvents, applications, companies] = await Promise.all([
    getUpcomingEventsData(),
    getApplicationsListData(params),
    getCompaniesListData(params),
  ]);

  return {
    upcomingEvents,
    applications,
    companies,
    hasOpenSearch: Boolean(search),
  };
}

export async function getApplicationCreatePageData() {
  const userId = await requireAuthenticatedUserId();
  const companies = await db.company.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return {
    initialData: buildEmptyApplicationCreateDto(),
    companies: mapCompaniesToEditorDto(companies),
  };
}

export async function getApplicationEditPageData(id: string) {
  const userId = await requireAuthenticatedUserId();

  const [application, companies] = await Promise.all([
    db.application.findUnique({
      where: { id, userId },
    }),
    db.company.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!application) notFound();

  return {
    editorDto: mapApplicationToEditorDto(application),
    companies: mapCompaniesToEditorDto(companies),
  };
}

export async function getApplicationDetailPageData(id: string) {
  const userId = await requireAuthenticatedUserId();

  const application = await db.application.findUnique({
    where: { id, userId },
    include: {
      company: true,
      events: { orderBy: { scheduledDate: "asc" } },
    },
  });

  if (!application) notFound();

  return mapApplicationToDetailDto(application);
}

export async function getApplicationDetailContextData(applicationId: string) {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  const [user, latestExport, application] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.resumeExport.findFirst({
      where: { applicationId, userId },
      orderBy: { createdAt: "desc" },
      select: {
        fileName: true,
        tailoredFor: true,
        matchAnalysis: true,
        structuredSnapshot: true,
      },
    }),
    db.application.findUnique({
      where: { id: applicationId, userId },
      select: { jobSearchId: true },
    }),
  ]);
  const snapshot = latestExport
    ? readResumeSnapshot(latestExport.structuredSnapshot)
    : null;
  return {
    viewerId: userId,
    viewerEmail: user?.email ?? "",
    matchAnalysis: parseMatchAnalysis(latestExport?.matchAnalysis),
    resumeTitle:
      snapshot?.header.degree ??
      latestExport?.tailoredFor ??
      latestExport?.fileName ??
      null,
    canCloseSearch: Boolean(search && application?.jobSearchId === search.id),
  };
}

export async function getEventPrepPageData(
  applicationId: string,
  eventId: string,
) {
  const application = await getApplicationDetailPageData(applicationId);
  const event = application.events.find((item) => item.id === eventId);
  if (!event) notFound();
  return { application, event };
}

export function getCompanyCreatePageData() {
  return {
    initialData: buildEmptyCompanyCreateDto(),
  };
}

export async function getCompanyEditPageData(id: string) {
  const userId = await requireAuthenticatedUserId();

  const company = await db.company.findUnique({
    where: { id, userId },
  });

  if (!company) notFound();

  return {
    editorDto: mapCompanyToEditorDto(company),
  };
}

export async function getEventCreatePageData(
  applicationId?: string,
  type?: EventType,
) {
  const userId = await requireAuthenticatedUserId();
  const search = await getOpenJobSearch(db, userId);
  const applications = await db.application.findMany({
    where: search ? { userId, jobSearchId: search.id } : { id: { in: [] } },
    include: applicationListInclude,
    orderBy: { appliedDate: "desc" },
  });

  const initialData = buildEmptyEventCreateDto(applicationId);
  if (type) initialData.type = type;
  if (type === "FOLLOW_UP") {
    const selected = applications.find(
      (application) => application.id === applicationId,
    );
    if (selected)
      initialData.scheduledDate = addBusinessDays(selected.appliedDate, 5);
  }
  return { initialData, applications: mapApplicationsToListDto(applications) };
}

export type CompanyOption = CompanyEditorDTO;
