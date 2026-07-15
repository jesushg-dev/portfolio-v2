import type { EventType } from "@/features/job-tracker/types";

export interface EventCreateFormDTO {
  applicationId: string;
  type: EventType;
  title: string;
  description: string;
  scheduledDate: Date;
  duration?: number;
  location: string;
  isVirtual: boolean;
  meetingLink: string;
}

export function buildEmptyEventCreateDto(
  applicationId = "",
): EventCreateFormDTO {
  return {
    applicationId,
    type: "INTERVIEW",
    title: "",
    description: "",
    scheduledDate: new Date(),
    duration: 60,
    location: "",
    isVirtual: false,
    meetingLink: "",
  };
}
