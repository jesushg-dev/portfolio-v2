import "server-only";

import {
  getGoogleCalendarAccessTokenForUser,
  getGoogleCalendarConnectionForUser,
} from "./connection";
import type {
  GoogleCalendarEventBody,
  GoogleCalendarRemoteEvent,
} from "./event-mapping";

export class GoogleCalendarApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GoogleCalendarApiError";
    this.status = status;
  }
}

async function calendarFetch(
  userId: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const accessToken = await getGoogleCalendarAccessTokenForUser(userId);
  if (!accessToken) {
    throw new GoogleCalendarApiError("Google Calendar not connected", 401);
  }

  const connection = await getGoogleCalendarConnectionForUser(userId);
  const calendarId = encodeURIComponent(connection?.calendarId ?? "primary");
  const url = path.startsWith("http")
    ? path
    : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return response;
}

export async function insertGoogleCalendarEvent(
  userId: string,
  body: GoogleCalendarEventBody,
): Promise<GoogleCalendarRemoteEvent> {
  const response = await calendarFetch(userId, "/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GoogleCalendarApiError(
      `Google Calendar insert failed: ${response.status} ${text}`,
      response.status,
    );
  }

  return (await response.json()) as GoogleCalendarRemoteEvent;
}

export async function patchGoogleCalendarEvent(
  userId: string,
  eventId: string,
  body: Partial<GoogleCalendarEventBody>,
): Promise<GoogleCalendarRemoteEvent> {
  const response = await calendarFetch(
    userId,
    `/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new GoogleCalendarApiError(
      `Google Calendar patch failed: ${response.status} ${text}`,
      response.status,
    );
  }

  return (await response.json()) as GoogleCalendarRemoteEvent;
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string,
): Promise<void> {
  const response = await calendarFetch(
    userId,
    `/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );

  if (response.status === 404 || response.status === 410) {
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new GoogleCalendarApiError(
      `Google Calendar delete failed: ${response.status} ${text}`,
      response.status,
    );
  }
}

export async function getGoogleCalendarEvent(
  userId: string,
  eventId: string,
): Promise<GoogleCalendarRemoteEvent | null> {
  const response = await calendarFetch(
    userId,
    `/events/${encodeURIComponent(eventId)}`,
  );

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new GoogleCalendarApiError(
      `Google Calendar get failed: ${response.status} ${text}`,
      response.status,
    );
  }

  return (await response.json()) as GoogleCalendarRemoteEvent;
}
