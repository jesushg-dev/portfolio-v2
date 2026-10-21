export { generateMetadata } from "./metadata";
import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { AdminOverview } from "@/features/analytics/components/admin-overview";
import { emptyAnalyticsSummary } from "@/features/analytics/lib/summarize";
import { getAnalyticsSummary } from "@/features/analytics/server/queries";
import {
  getDashboardStatsData,
  getUpcomingEventsData,
  type DashboardStatsDTO,
} from "@/features/job-tracker/server/job-tracker-queries";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const EMPTY_JOB_STATS: DashboardStatsDTO = {
  totalApplications: 0,
  totalCompanies: 0,
  applied: 0,
  inProgress: 0,
  offers: 0,
  ghosted: 0,
  rejected: 0,
  hired: 0,
};

const DashboardPage: FC = async () => {
  const t = await getTranslations("admin.dashboard");
  const locale = await getLocale();

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  const [
    profile,
    traffic,
    jobs,
    upcomingEvents,
    services,
    certificationsCount,
    projectsCount,
    skillsCount,
  ] = await Promise.all([
    userId
      ? db.profile.findUnique({ where: { userId } })
      : Promise.resolve(null),
    userId
      ? getAnalyticsSummary(userId, { days: 30, includeReferrers: true })
      : Promise.resolve(emptyAnalyticsSummary()),
    userId ? getDashboardStatsData() : Promise.resolve(EMPTY_JOB_STATS),
    userId ? getUpcomingEventsData(3) : Promise.resolve([]),
    userId
      ? db.service.findMany({
          where: { userId },
          include: {
            ServiceTranslation: { include: { language: true } },
          },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    userId ? db.certification.count({ where: { userId } }) : Promise.resolve(0),
    userId ? db.project.count({ where: { userId } }) : Promise.resolve(0),
    userId ? db.skill.count({ where: { userId } }) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("welcomeTitle")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("welcomeSubtitle")}
          </p>
        </div>
        <ExportSeedJsonButton entity="all" />
      </div>

      <AdminOverview
        data={{
          hasProfile: Boolean(profile),
          traffic,
          jobs,
          upcomingEvents,
          services: services.map((service) => {
            const translation =
              service.ServiceTranslation.find(
                (row) => row.language.code === locale,
              ) ?? service.ServiceTranslation[0];
            return {
              id: service.id,
              title: translation?.title?.trim() || service.type,
              type: service.type,
              isActive: service.isActive,
              featured: service.featured,
            };
          }),
          inventory: {
            certifications: certificationsCount,
            projects: projectsCount,
            skills: skillsCount,
          },
        }}
      />
    </div>
  );
};

export default DashboardPage;
