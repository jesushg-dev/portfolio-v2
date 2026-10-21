import type { AnalyticsSummary } from "@/features/analytics/lib/summarize";
import type { DashboardStatsDTO } from "@/features/job-tracker/server/job-tracker-queries";
import type { UpcomingEventDTO } from "@/features/job-tracker/server/job-tracker-queries";

export interface DashboardServiceRow {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  featured: boolean;
}

export interface AdminOverviewData {
  hasProfile: boolean;
  traffic: AnalyticsSummary;
  jobs: DashboardStatsDTO;
  upcomingEvents: UpcomingEventDTO[];
  services: DashboardServiceRow[];
  inventory: {
    certifications: number;
    projects: number;
    skills: number;
  };
}
