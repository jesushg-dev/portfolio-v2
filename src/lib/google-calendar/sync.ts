import "server-only";

import { db } from "@/server/db";

import {
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvent,
  insertGoogleCalendarEvent,
  patchGoogleCalendarEvent,
} from "./api";
import {
  getGoogleCalendarConnectionForUser,
} from "./connection";
import {
  buildGoogleCalendarEventBody,
  mapGoogleEventToLocalPatch,
  PULL_MAX_EVENTS,
  shouldPushEventToGoogleCalendar,
  shouldSkipGoogleCalendarPull,
  type JobTrackerEventForCalendar,
} from "./event-mapping";

function logSyncError(action: string, error: unknown): void {
  console.error(`[google-calendar] ${action} failed`, error);
}

export async function pushApplicationEventToGoogleCalendar(
  userId: string,
  event: JobTrackerEventForCalendar & { completed?: boolean | null },
): Promise<void> {
  if (!shouldPushEventToGoogleCalendar(event)) {
    return;
  }

  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection || connection.lastRefreshErrorAt) {
    return;
  }

  try {
    const body = buildGoogleCalendarEventBody(event);
    const remote = await insertGoogleCalendarEvent(userId, body);

    if (!remote.id) return;

    await db.applicationEvent.update({
      where: { id: event.id, userId },
      data: {
        googleEventId: remote.id,
        googleEtag: remote.etag ?? null,
        googleSyncedAt: new Date(),
      },
    });
  } catch (error) {
    logSyncError("push", error);
  }
}

export async function updateApplicationEventOnGoogleCalendar(
  userId: string,
  event: JobTrackerEventForCalendar & { googleEventId?: string | null },
): Promise<void> {
  if (!event.googleEventId) return;

  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection || connection.lastRefreshErrorAt) {
    return;
  }

  try {
    const body = buildGoogleCalendarEventBody(event);
    const remote = await patchGoogleCalendarEvent(
      userId,
      event.googleEventId,
      body,
    );

    await db.applicationEvent.update({
      where: { id: event.id, userId },
      data: {
        googleEtag: remote.etag ?? null,
        googleSyncedAt: new Date(),
      },
    });
  } catch (error) {
    logSyncError("update", error);
  }
}

export async function deleteApplicationEventFromGoogleCalendar(
  userId: string,
  googleEventId: string | null | undefined,
): Promise<void> {
  if (!googleEventId) return;

  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection) {
    return;
  }

  try {
    await deleteGoogleCalendarEvent(userId, googleEventId);
  } catch (error) {
    logSyncError("delete", error);
  }
}

interface UpcomingEventRow {
  id: string;
  title: string;
  googleEventId: string | null;
  googleEtag: string | null;
  scheduledDate: Date;
  duration: number | null;
  location: string | null;
  meetingLink: string | null;
}

/**
 * Lazy pull: refresh linked upcoming events from Google when throttled window elapsed.
 * Never lists the full calendar — only `events.get` by known ids.
 */
export async function pullLinkedUpcomingEventsFromGoogle(
  userId: string,
  events: UpcomingEventRow[],
): Promise<UpcomingEventRow[]> {
  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection || connection.lastRefreshErrorAt) {
    return events;
  }

  if (shouldSkipGoogleCalendarPull(connection.lastPullAt)) {
    return events;
  }

  const linked = events
    .filter((event) => event.googleEventId)
    .slice(0, PULL_MAX_EVENTS);

  if (linked.length === 0) {
    await db.googleCalendarConnection.update({
      where: { userId },
      data: { lastPullAt: new Date() },
    });
    return events;
  }

  const byId = new Map(events.map((event) => [event.id, { ...event }]));

  await Promise.all(
    linked.map(async (event) => {
      try {
        const remote = await getGoogleCalendarEvent(
          userId,
          event.googleEventId!,
        );

        if (!remote) {
          await db.applicationEvent.update({
            where: { id: event.id, userId },
            data: {
              googleEventId: null,
              googleEtag: null,
              googleSyncedAt: null,
            },
          });
          const local = byId.get(event.id);
          if (local) {
            local.googleEventId = null;
            local.googleEtag = null;
          }
          return;
        }

        if (remote.etag && remote.etag === event.googleEtag) {
          return;
        }

        const patch = mapGoogleEventToLocalPatch(remote);
        const updated = await db.applicationEvent.update({
          where: { id: event.id, userId },
          data: {
            ...patch,
            googleEtag: remote.etag ?? event.googleEtag,
            googleSyncedAt: new Date(),
          },
        });

        byId.set(event.id, {
          id: updated.id,
          title: updated.title,
          googleEventId: updated.googleEventId,
          googleEtag: updated.googleEtag,
          scheduledDate: updated.scheduledDate,
          duration: updated.duration,
          location: updated.location,
          meetingLink: updated.meetingLink,
        });
      } catch (error) {
        logSyncError(`pull:${event.id}`, error);
      }
    }),
  );

  await db.googleCalendarConnection.update({
    where: { userId },
    data: { lastPullAt: new Date() },
  });

  return events.map((event) => byId.get(event.id) ?? event);
}
