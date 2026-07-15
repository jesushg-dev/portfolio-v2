import type { ApplicationStatus } from "@/features/job-tracker/lib/application-editor-dto";

export const statusVariants: Record<
  ApplicationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPLIED: "outline",
  INTERVIEW: "default",
  OFFER: "secondary",
  REJECTED: "destructive",
  HIRED: "default",
};

export const eventTypeIcons: Record<string, string> = {
  INTERVIEW: "👥",
  TECHNICAL_TEST: "💻",
  QUESTIONNAIRE: "📝",
  PHONE_CALL: "📞",
  MEETING: "🤝",
  FOLLOW_UP: "📋",
};
