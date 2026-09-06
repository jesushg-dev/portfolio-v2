/** Minimum Calendar scope for job-tracker event sync (BYO OAuth). */
export const GOOGLE_CALENDAR_REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export function hasGoogleCalendarEventsScope(
  scope: string | null | undefined,
): boolean {
  if (!scope) return false;
  const parts = scope.split(/\s+/);
  return GOOGLE_CALENDAR_REQUIRED_SCOPES.every((required) =>
    parts.includes(required),
  );
}
