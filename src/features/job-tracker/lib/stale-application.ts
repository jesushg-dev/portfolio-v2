import type { ApplicationStatus } from "@/features/job-tracker/lib/application-editor-dto";

/** APPLIED with no event/activity for this many days → suggest Ghosted. */
export const APPLIED_STALE_DAYS = 21;

/** GHOSTED untouched for this many days → hide from the board by default. */
export const GHOST_ARCHIVE_DAYS = 30;

/** After "Not now", wait this many days before suggesting Ghosted again. */
export const GHOST_NUDGE_SNOOZE_DAYS = 7;

const DAY_MS = 86_400_000;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function daysBetween(from: Date | string, to: Date | string): number {
  return Math.floor((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}

export function maxDate(dates: (Date | null | undefined)[]): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (!latest || date.getTime() > latest.getTime()) latest = date;
  }
  return latest;
}

export function computeLastActivityAt(
  appliedDate: Date,
  events: { scheduledDate: Date; completedAt?: Date | null }[],
): Date {
  return (
    maxDate([
      appliedDate,
      ...events.flatMap((event) => [event.scheduledDate, event.completedAt]),
    ]) ?? appliedDate
  );
}

export function ghostNudgeSnoozeUntil(
  days = GHOST_NUDGE_SNOOZE_DAYS,
  now = new Date(),
): Date {
  const safeDays = Math.min(90, Math.max(1, Math.round(days)));
  return new Date(now.getTime() + safeDays * DAY_MS);
}

export function isSuggestedGhost(
  application: {
    status: ApplicationStatus;
    lastActivityAt: Date | string;
    ghostNudgeSnoozedUntil?: Date | string | null;
  },
  now = new Date(),
): boolean {
  if (application.status !== "APPLIED") return false;
  if (application.ghostNudgeSnoozedUntil) {
    const snoozedUntil = toDate(application.ghostNudgeSnoozedUntil);
    if (snoozedUntil.getTime() > now.getTime()) return false;
  }
  const lastActivityAt = toDate(application.lastActivityAt);
  if (lastActivityAt.getTime() > now.getTime()) return false;
  return daysBetween(lastActivityAt, now) >= APPLIED_STALE_DAYS;
}

export function isArchivedGhost(
  application: { status: ApplicationStatus; updatedAt: Date | string },
  now = new Date(),
): boolean {
  if (application.status !== "GHOSTED") return false;
  return daysBetween(application.updatedAt, now) >= GHOST_ARCHIVE_DAYS;
}
