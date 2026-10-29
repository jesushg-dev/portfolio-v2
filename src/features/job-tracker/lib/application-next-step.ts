import type { ApplicationDetail } from "@/features/job-tracker/types";

export type ApplicationNextStep =
  | { kind: "closed" }
  | { kind: "pending-event"; eventId: string; eventType: string }
  | { kind: "offer" }
  | { kind: "interview" }
  | { kind: "ghosted" }
  | { kind: "ghost-snoozed" }
  | { kind: "follow-up"; dueDate: Date; overdue: boolean }
  | { kind: "tailor" };

/** Add working days, excluding Saturdays and Sundays. */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) remaining -= 1;
  }
  return result;
}

export function getApplicationNextStep(
  application: Pick<
    ApplicationDetail,
    "status" | "appliedDate" | "events" | "cvFile"
  > &
    Partial<Pick<ApplicationDetail, "ghostNudgeSnoozedUntil">>,
  now = new Date(),
): ApplicationNextStep {
  if (application.status === "HIRED" || application.status === "REJECTED") {
    return { kind: "closed" };
  }

  const pending = application.events
    .filter((event) => !event.completed)
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    )[0];
  if (pending) {
    return {
      kind: "pending-event",
      eventId: pending.id,
      eventType: pending.type,
    };
  }

  if (application.status === "OFFER") return { kind: "offer" };
  if (application.status === "INTERVIEW") return { kind: "interview" };
  if (application.status === "GHOSTED") {
    if (
      application.ghostNudgeSnoozedUntil &&
      new Date(application.ghostNudgeSnoozedUntil) > now
    ) {
      return { kind: "ghost-snoozed" };
    }
    return { kind: "ghosted" };
  }

  const dueDate = addBusinessDays(new Date(application.appliedDate), 5);
  if (now >= dueDate) return { kind: "follow-up", dueDate, overdue: true };
  if (!application.cvFile?.url) return { kind: "tailor" };
  return { kind: "follow-up", dueDate, overdue: now >= dueDate };
}
