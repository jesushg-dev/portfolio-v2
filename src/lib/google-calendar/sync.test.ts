const mockGetConnection = jest.fn<
  Promise<{
    userId: string;
    calendarId: string;
    lastRefreshErrorAt: Date | null;
    lastPullAt: Date | null;
  } | null>,
  [unknown?]
>();
const mockInsert = jest.fn<
  Promise<{ id: string; etag?: string | null }>,
  [unknown?]
>();
const mockPatch = jest.fn<
  Promise<{ id: string; etag?: string | null }>,
  [unknown?]
>();
const mockDelete = jest.fn<Promise<void>, [unknown?]>();
const mockGet = jest.fn<Promise<unknown>, [unknown?]>();
const mockUpdateEvent = jest.fn<Promise<void>, [unknown?]>();
const mockUpdateConnection = jest.fn<Promise<void>, [unknown?]>();

jest.mock("./connection", () => ({
  getGoogleCalendarConnectionForUser: (...args: unknown[]) =>
    mockGetConnection(...args),
}));

jest.mock("./api", () => ({
  insertGoogleCalendarEvent: (...args: unknown[]) => mockInsert(...args),
  patchGoogleCalendarEvent: (...args: unknown[]) => mockPatch(...args),
  deleteGoogleCalendarEvent: (...args: unknown[]) => mockDelete(...args),
  getGoogleCalendarEvent: (...args: unknown[]) => mockGet(...args),
}));

jest.mock("@/server/db", () => ({
  db: {
    applicationEvent: {
      update: (...args: unknown[]) => mockUpdateEvent(...args),
    },
    googleCalendarConnection: {
      update: (...args: unknown[]) => mockUpdateConnection(...args),
    },
  },
}));

import {
  deleteApplicationEventFromGoogleCalendar,
  pullLinkedUpcomingEventsFromGoogle,
  pushApplicationEventToGoogleCalendar,
  updateApplicationEventOnGoogleCalendar,
} from "./sync";

describe("google calendar sync mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConnection.mockResolvedValue({
      userId: "user_1",
      calendarId: "primary",
      lastRefreshErrorAt: null,
      lastPullAt: null,
    });
  });

  it("pushes create when connected and not completed", async () => {
    mockInsert.mockResolvedValue({ id: "gcal_1", etag: "etag_1" });
    mockUpdateEvent.mockResolvedValue(undefined);

    await pushApplicationEventToGoogleCalendar("user_1", {
      id: "evt_1",
      title: "Interview",
      scheduledDate: new Date("2026-06-01T15:00:00.000Z"),
      duration: 60,
      completed: false,
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockUpdateEvent).toHaveBeenCalledTimes(1);
    const updateArg = mockUpdateEvent.mock.calls[0]?.[0] as {
      where: { id: string; userId: string };
      data: { googleEventId: string; googleEtag: string };
    };
    expect(updateArg.where).toEqual({ id: "evt_1", userId: "user_1" });
    expect(updateArg.data.googleEventId).toBe("gcal_1");
    expect(updateArg.data.googleEtag).toBe("etag_1");
  });

  it("skips push when event is already completed", async () => {
    await pushApplicationEventToGoogleCalendar("user_1", {
      id: "evt_2",
      title: "CV emailed",
      scheduledDate: new Date(),
      completed: true,
    });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdateEvent).not.toHaveBeenCalled();
  });

  it("skips push when not connected", async () => {
    mockGetConnection.mockResolvedValue(null);

    await pushApplicationEventToGoogleCalendar("user_1", {
      id: "evt_3",
      title: "Meeting",
      scheduledDate: new Date(),
      completed: false,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("patches Google when updating a linked event", async () => {
    mockPatch.mockResolvedValue({ id: "gcal_1", etag: "etag_2" });
    mockUpdateEvent.mockResolvedValue(undefined);

    await updateApplicationEventOnGoogleCalendar("user_1", {
      id: "evt_1",
      title: "Updated interview",
      scheduledDate: new Date("2026-06-02T15:00:00.000Z"),
      duration: 45,
      googleEventId: "gcal_1",
    });

    expect(mockPatch).toHaveBeenCalledWith(
      "user_1",
      "gcal_1",
      expect.objectContaining({ summary: "Updated interview" }),
    );
  });

  it("deletes Google event when linked", async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteApplicationEventFromGoogleCalendar("user_1", "gcal_1");

    expect(mockDelete).toHaveBeenCalledWith("user_1", "gcal_1");
  });

  it("skips lazy pull when Calendar is not connected", async () => {
    mockGetConnection.mockResolvedValue(null);
    const events = [
      {
        id: "evt_1",
        title: "Interview",
        googleEventId: "gcal_1",
        googleEtag: "etag_1",
        scheduledDate: new Date("2026-06-01T15:00:00.000Z"),
        duration: 60,
        location: null,
        meetingLink: null,
      },
    ];

    const result = await pullLinkedUpcomingEventsFromGoogle("user_1", events);

    expect(result).toEqual(events);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
