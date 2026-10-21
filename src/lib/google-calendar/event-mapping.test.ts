import {
  buildGoogleCalendarEventBody,
  shouldPushEventToGoogleCalendar,
  shouldSkipGoogleCalendarPull,
  mapGoogleEventToLocalPatch,
  PULL_THROTTLE_MS,
} from "./event-mapping";

describe("shouldPushEventToGoogleCalendar", () => {
  it("pushes incomplete events including FOLLOW_UP-style meetings", () => {
    expect(shouldPushEventToGoogleCalendar({ completed: false })).toBe(true);
    expect(shouldPushEventToGoogleCalendar({})).toBe(true);
  });

  it("skips events created already completed (e.g. CV emailed log)", () => {
    expect(shouldPushEventToGoogleCalendar({ completed: true })).toBe(false);
  });
});

describe("buildGoogleCalendarEventBody", () => {
  it("maps schedule, company context, and private extended property", () => {
    const start = new Date("2026-06-01T15:00:00.000Z");
    const body = buildGoogleCalendarEventBody({
      id: "evt_1",
      title: "Follow-up call",
      description: "Recruiter check-in",
      scheduledDate: start,
      duration: 15,
      meetingLink: "https://meet.google.com/abc",
      companyName: "Acme",
      position: "Engineer",
    });

    expect(body.summary).toBe("Follow-up call");
    expect(body.start.dateTime).toBe(start.toISOString());
    expect(body.end.dateTime).toBe(
      new Date(start.getTime() + 15 * 60_000).toISOString(),
    );
    expect(body.location).toBe("https://meet.google.com/abc");
    expect(body.description).toContain("Engineer @ Acme");
    expect(body.description).toContain("Meeting link:");
    expect(body.extendedProperties.private).toEqual({
      applicationEventId: "evt_1",
      source: "job-tracker",
    });
  });

  it("defaults duration to 30 minutes when missing", () => {
    const start = new Date("2026-06-01T10:00:00.000Z");
    const body = buildGoogleCalendarEventBody({
      id: "evt_2",
      title: "Interview",
      scheduledDate: start,
    });

    expect(body.end.dateTime).toBe(
      new Date(start.getTime() + 30 * 60_000).toISOString(),
    );
  });
});

describe("shouldSkipGoogleCalendarPull", () => {
  it("skips when last pull is within throttle window", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const lastPullAt = new Date(now.getTime() - PULL_THROTTLE_MS + 1_000);
    expect(shouldSkipGoogleCalendarPull(lastPullAt, now)).toBe(true);
  });

  it("does not skip when never pulled or outside throttle", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    expect(shouldSkipGoogleCalendarPull(null, now)).toBe(false);
    expect(
      shouldSkipGoogleCalendarPull(
        new Date(now.getTime() - PULL_THROTTLE_MS - 1),
        now,
      ),
    ).toBe(false);
  });
});

describe("mapGoogleEventToLocalPatch", () => {
  it("maps remote schedule and hangout link", () => {
    const patch = mapGoogleEventToLocalPatch({
      id: "g1",
      summary: "Updated title",
      start: { dateTime: "2026-07-01T14:00:00.000Z" },
      end: { dateTime: "2026-07-01T15:00:00.000Z" },
      hangoutLink: "https://meet.google.com/xyz",
      location: "Remote",
    });

    expect(patch.title).toBe("Updated title");
    expect(patch.scheduledDate?.toISOString()).toBe("2026-07-01T14:00:00.000Z");
    expect(patch.duration).toBe(60);
    expect(patch.meetingLink).toBe("https://meet.google.com/xyz");
    expect(patch.location).toBe("Remote");
  });
});
