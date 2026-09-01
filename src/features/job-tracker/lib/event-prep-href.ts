export const eventPrepPathname =
  "/admin/job-tracker/applications/[id]/events/[eventId]" as const;

export function eventPrepHref(applicationId: string, eventId: string) {
  return {
    pathname: eventPrepPathname,
    params: { id: applicationId, eventId },
  };
}
