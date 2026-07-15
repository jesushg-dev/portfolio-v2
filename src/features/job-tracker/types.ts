import type { RouterOutputs } from "@/trpc/react";
import type { ApplicationStatus } from "@/features/job-tracker/lib/application-editor-dto";

export type { ApplicationStatus };

export type EventType =
  | "INTERVIEW"
  | "TECHNICAL_TEST"
  | "QUESTIONNAIRE"
  | "PHONE_CALL"
  | "MEETING"
  | "FOLLOW_UP";

export type Company =
  RouterOutputs["jobTrackerAdmin"]["getCompanies"]["data"][number];

export type ApplicationListRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];

export type ApplicationDetail =
  RouterOutputs["jobTrackerAdmin"]["getApplicationById"];

export type ApplicationEvent = ApplicationDetail["events"][number];

export type DashboardStats =
  RouterOutputs["jobTrackerAdmin"]["getDashboardStats"];

export type UpcomingEvent =
  RouterOutputs["jobTrackerAdmin"]["getUpcomingEvents"][number];

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  applicationId: string;
  uploadedAt: Date;
}
