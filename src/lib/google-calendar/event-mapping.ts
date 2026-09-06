export interface JobTrackerEventForCalendar {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: Date;
  duration?: number | null;
  location?: string | null;
  meetingLink?: string | null;
  companyName?: string | null;
  position?: string | null;
}

export interface GoogleCalendarEventBody {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  extendedProperties: {
    private: {
      applicationEventId: string;
      source: "job-tracker";
    };
  };
}

const DEFAULT_DURATION_MINUTES = 30;

export function shouldPushEventToGoogleCalendar(event: {
  completed?: boolean | null;
}): boolean {
  return event.completed !== true;
}

export function buildGoogleCalendarEventBody(
  event: JobTrackerEventForCalendar,
): GoogleCalendarEventBody {
  const durationMinutes =
    event.duration && event.duration > 0
      ? event.duration
      : DEFAULT_DURATION_MINUTES;

  const start = new Date(event.scheduledDate);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const descriptionParts: string[] = [];
  if (event.companyName || event.position) {
    descriptionParts.push(
      [event.position, event.companyName].filter(Boolean).join(" @ "),
    );
  }
  if (event.description?.trim()) {
    descriptionParts.push(event.description.trim());
  }
  if (event.meetingLink?.trim()) {
    descriptionParts.push(`Meeting link: ${event.meetingLink.trim()}`);
  }

  const location = [event.location?.trim(), event.meetingLink?.trim()].find(
    (value): value is string => Boolean(value && value.length > 0),
  );

  return {
    summary: event.title,
    ...(descriptionParts.length > 0
      ? { description: descriptionParts.join("\n\n") }
      : {}),
    ...(location ? { location } : {}),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    extendedProperties: {
      private: {
        applicationEventId: event.id,
        source: "job-tracker",
      },
    },
  };
}

export interface GoogleCalendarRemoteEvent {
  id: string;
  etag?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  hangoutLink?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
}

export function mapGoogleEventToLocalPatch(remote: GoogleCalendarRemoteEvent): {
  title?: string;
  scheduledDate?: Date;
  duration?: number;
  location?: string | null;
  meetingLink?: string | null;
} {
  const patch: {
    title?: string;
    scheduledDate?: Date;
    duration?: number;
    location?: string | null;
    meetingLink?: string | null;
  } = {};

  if (remote.summary?.trim()) {
    patch.title = remote.summary.trim();
  }

  const startRaw = remote.start?.dateTime ?? remote.start?.date;
  if (startRaw) {
    const scheduledDate = new Date(startRaw);
    if (!Number.isNaN(scheduledDate.getTime())) {
      patch.scheduledDate = scheduledDate;

      const endRaw = remote.end?.dateTime ?? remote.end?.date;
      if (endRaw) {
        const endDate = new Date(endRaw);
        if (!Number.isNaN(endDate.getTime())) {
          const minutes = Math.round(
            (endDate.getTime() - scheduledDate.getTime()) / 60_000,
          );
          if (minutes > 0) {
            patch.duration = minutes;
          }
        }
      }
    }
  }

  if (remote.hangoutLink?.trim()) {
    patch.meetingLink = remote.hangoutLink.trim();
  }

  if (remote.location !== undefined) {
    const location = remote.location?.trim() || null;
    if (location && !/^https?:\/\//i.test(location)) {
      patch.location = location;
    } else if (!location) {
      patch.location = null;
    } else if (!patch.meetingLink) {
      patch.meetingLink = location;
    }
  }

  return patch;
}

export const PULL_THROTTLE_MS = 5 * 60 * 1000;
export const PULL_MAX_EVENTS = 10;

export function shouldSkipGoogleCalendarPull(
  lastPullAt: Date | null | undefined,
  now = new Date(),
  throttleMs = PULL_THROTTLE_MS,
): boolean {
  if (!lastPullAt) return false;
  return now.getTime() - lastPullAt.getTime() < throttleMs;
}
